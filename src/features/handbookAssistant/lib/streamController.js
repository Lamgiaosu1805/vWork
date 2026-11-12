import { store } from "../../../redux/store";
import {
  CANCEL_FALLBACK_MS,
  DELTA_FLUSH_MS,
  SOCKET_EVENTS,
  STREAM_IDLE_TIMEOUT_MS,
} from "../constants";
import {
  addQuestion,
  appendStreamText,
  bindStream,
  failStream,
  finishStream,
  markCancelSent,
  markResynced,
  requestCancel,
  removeTurn,
  conversationKeyOf,
  startNewConversation,
} from "../store/handbookAssistantSlice";
import handbookSocket from "./handbookSocket";
import { uuidV4 } from "./normalize";

// Vòng đời 1 câu trả lời phía app. Sống ngoài component (đọc/ghi thẳng `store`) để câu trả lời vẫn chạy khi
// người dùng rời màn trợ lý. Khác web: mất socket KHÔNG báo lỗi ngay — app hay bị ngắt khi ra nền, còn
// server vẫn trả lời tiếp và lưu lại; khi nối lại thì hỏi lại cùng clientId để server phát lại kết quả.

const getStreaming = () => store.getState().handbookAssistant.streaming;

let pending = { messageId: null, text: "" };
let flushTimer = null;
let idleTimer = null;
let cancelFallbackTimer = null;
let onTurnFinished = () => {};

// Màn hình đăng ký để làm mới lịch sử/hạn mức sau mỗi lượt (TanStack Query chỉ dùng được trong React).
export const setTurnFinishedListener = (listener) => {
  onTurnFinished = listener ?? (() => {});
};

const flush = () => {
  clearTimeout(flushTimer);
  flushTimer = null;
  if (pending.text) store.dispatch(appendStreamText(pending));
  pending = { messageId: null, text: "" };
};

const stopIdleWatch = () => {
  clearTimeout(idleTimer);
  idleTimer = null;
};

const failCurrent = (code) => {
  const s = getStreaming();
  if (!s) return;
  flush();
  stopIdleWatch();
  store.dispatch(failStream({ messageId: s.messageId, clientId: s.clientId, code }));
  onTurnFinished();
};

const watchIdle = () => {
  stopIdleWatch();
  idleTimer = setTimeout(() => failCurrent("NETWORK"), STREAM_IDLE_TIMEOUT_MS);
};

// Gửi handbook:cancel khi đã có messageId (người dùng có thể bấm Dừng trước khi nhận ack/start).
const sendPendingCancel = () => {
  const s = getStreaming();
  if (!s?.cancelRequested || !s.messageId || s.cancelSent) return;
  store.dispatch(markCancelSent());
  handbookSocket.cancel({ messageId: s.messageId });
  clearTimeout(cancelFallbackTimer);
  const { messageId } = s;
  cancelFallbackTimer = setTimeout(() => {
    store.dispatch(failStream({ messageId, code: "CANCELLED" }));
  }, CANCEL_FALLBACK_MS);
};

const handleStart = ({ clientId, conversationId, messageId }) => {
  store.dispatch(bindStream({ clientId, conversationId, messageId }));
  sendPendingCancel();
  if (getStreaming()) watchIdle();
};

const handleDelta = ({ messageId, text }) => {
  if (getStreaming()?.messageId !== messageId || !text) return;
  if (pending.messageId && pending.messageId !== messageId) flush();
  pending = { messageId, text: pending.text + text };
  if (!flushTimer) flushTimer = setTimeout(flush, DELTA_FLUSH_MS);
  watchIdle();
};

const handleDone = (payload) => {
  // Sự kiện của thiết bị khác cùng tài khoản (vd. web) cũng tới đây — chỉ nhận đúng câu đang chạy.
  if (getStreaming()?.messageId !== payload.messageId) return;
  flush();
  stopIdleWatch();
  clearTimeout(cancelFallbackTimer);
  store.dispatch(finishStream(payload));
  onTurnFinished();
};

const handleError = ({ messageId, code }) => {
  if (getStreaming()?.messageId !== messageId) return;
  flush();
  stopIdleWatch();
  clearTimeout(cancelFallbackTimer);
  store.dispatch(failStream({ messageId, code }));
  onTurnFinished();
};

// Hỏi lại cùng clientId sau khi mất kết nối / app về foreground: server không tạo lượt mới, không trừ
// lượt, chỉ phát lại ack + start, rồi `done`/`error` nếu câu trả lời đã xong (đang chạy thì gửi tiếp).
export const resyncStream = async () => {
  const s = getStreaming();
  if (!s || !s.messageId || !handbookSocket.isConnected()) return;
  store.dispatch(markResynced());
  watchIdle();
  const ack = await handbookSocket.ask({
    conversationId: s.conversationId,
    question: s.question,
    clientId: s.clientId,
  });
  if (ack?.ok) {
    store.dispatch(bindStream({ clientId: s.clientId, conversationId: ack.conversationId, messageId: ack.messageId }));
    sendPendingCancel();
  } else if (ack?.code && ack.code !== "NETWORK" && getStreaming()?.clientId === s.clientId) {
    failCurrent(ack.code);
  }
};

// Gắn listener lên socket hiện tại. Gọi lại mỗi khi đổi token (chatSocket tạo socket mới, xoá listener cũ).
export const attachStreamListeners = (socket) => {
  if (!socket) return () => {};
  const handleConnect = () => {
    resyncStream();
  };
  socket.on(SOCKET_EVENTS.START, handleStart);
  socket.on(SOCKET_EVENTS.DELTA, handleDelta);
  socket.on(SOCKET_EVENTS.DONE, handleDone);
  socket.on(SOCKET_EVENTS.ERROR, handleError);
  socket.on("connect", handleConnect);
  return () => {
    socket.off(SOCKET_EVENTS.START, handleStart);
    socket.off(SOCKET_EVENTS.DELTA, handleDelta);
    socket.off(SOCKET_EVENTS.DONE, handleDone);
    socket.off(SOCKET_EVENTS.ERROR, handleError);
    socket.off("connect", handleConnect);
    flush();
  };
};

export const stopStreamTimers = () => {
  flush();
  stopIdleWatch();
  clearTimeout(cancelFallbackTimer);
};

// Trả về false nếu không gửi (câu rỗng hoặc đang có câu chạy).
export const askQuestion = async (rawQuestion) => {
  const question = String(rawQuestion ?? "").trim();
  const state = store.getState().handbookAssistant;
  if (!question || state.streaming) return false;

  const conversationId = state.activeConversationId;
  const clientId = uuidV4();
  store.dispatch(addQuestion({ conversationId, clientId, question }));
  watchIdle();

  const ack = await handbookSocket.ask({ conversationId, question, clientId });
  if (getStreaming()?.clientId !== clientId) return true;
  if (ack?.ok) {
    store.dispatch(bindStream({ clientId, conversationId: ack.conversationId, messageId: ack.messageId }));
    sendPendingCancel();
  } else {
    stopIdleWatch();
    store.dispatch(failStream({ clientId, code: ack?.code ?? "UNKNOWN", message: ack?.message }));
    onTurnFinished();
  }
  return true;
};

export const cancelAnswer = () => {
  store.dispatch(requestCancel());
  sendPendingCancel();
};

// Hỏi lại câu của một lượt bị lỗi. Lượt chưa tới được server (không có id) thì bỏ khỏi danh sách.
export const retryTurn = (message) => {
  const state = store.getState().handbookAssistant;
  if (state.streaming || !message?.question) return;
  if (!message.id) {
    store.dispatch(
      removeTurn({ conversationKey: conversationKeyOf(state.activeConversationId), clientId: message.clientId }),
    );
  }
  askQuestion(message.question);
};

export const askInNewConversation = (question) => {
  if (getStreaming()) return;
  store.dispatch(startNewConversation());
  if (question) askQuestion(question);
};
