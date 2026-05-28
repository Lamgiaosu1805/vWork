import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import {
  connectChatSocket,
  getChatSocket,
  isChatSocketConnected,
} from "../../../libs/chatSocket";
import {
  appendMessage,
  clearActiveConversationId,
  markMessagesSeen,
  setActiveConversationId,
  setLoadingMessages,
  setMessages,
  upsertConversation,
  updateMessageStatus,
} from "../../../redux/slice/chatSlice";
import {
  getCurrentUserKeys,
  isCurrentUser,
  resolveConversationId,
  resolveMessageId,
} from "../../../utils/chatUtils";
import chatApi from "../../../api/chat";
import MessageBubble from "../../../components/workplace/chat/MessageBubble";
import DateSeparator from "./DateSeparator";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const resolveConversationTitle = (conversation, currentUserKeys) => {
  if (!conversation) return "Cuộc trò chuyện";

  if (conversation?.display_name) return conversation.display_name;
  if (conversation?.name) return conversation.name;

  return "Cuộc trò chuyện";
};

const resolveMessageDayKey = (message) => {
  const value = message?.createdAt;
  return value ? dayjs(value).format("YYYY-MM-DD") : null;
};

const resolveDayLabel = (dateValue) => {
  if (!dateValue) return "";

  const messageDate = dayjs(dateValue);
  const today = dayjs().startOf("day");
  const diffDays = today.diff(messageDate.startOf("day"), "day");

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays === 2) return "Hôm kia";
  if (diffDays > 2 && diffDays < 7) {
    const weekday = messageDate.day();
    const labels = ["CN", "TH 2", "TH 3", "TH 4", "TH 5", "TH 6", "TH 7"];
    return labels[weekday] ?? messageDate.format("DD/MM/YYYY");
  }

  return messageDate.format("DD/MM/YYYY");
};

const buildTimelineItems = (messages = []) => {
  const timeline = [];
  messages.forEach((message, index) => {
    const dayKey = resolveMessageDayKey(message);
    const dayLabel = resolveDayLabel(message?.createdAt);
    const nextDayKey = resolveMessageDayKey(messages[index + 1]);

    timeline.push({
      type: "message",
      key: resolveMessageId(message),
      message,
    });

    if (dayKey && dayKey !== nextDayKey && dayLabel) {
      timeline.push({
        type: "separator",
        key: `separator_${dayKey}`,
        label: dayLabel,
      });
    }
  });

  return timeline;
};

const resolveMessageSender = (message) => message?.senderId ?? null;

const makeClientMessageId = () =>
  `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const LIMIT = 15;

export default function ChatRoomScreen({ route, navigation }) {
  const {
    conversationId: routeConversationId,
    conversation: initialConversation,
  } = route.params ?? {};
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const chatState = useSelector((state) => state.chat);

  const currentUserKeys = useMemo(() => getCurrentUserKeys(user), [user]);
  const flatListRef = useRef(null);
  const pageRef = useRef(1);
  const endReachedDuringMomentumRef = useRef(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(initialConversation ?? null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const conversationId = useMemo(
    () =>
      String(
        resolveConversationId(conversation) ?? routeConversationId ?? "",
      ) || null,
    [conversation, routeConversationId],
  );

  const messages = chatState.messagesByConversationId?.[conversationId] ?? [];
  const messagesDescending = useMemo(() => [...messages].reverse(), [messages]);
  const timelineItems = useMemo(
    () => buildTimelineItems(messagesDescending),
    [messagesDescending],
  );
  const loadingMessages =
    chatState.loadingMessagesByConversationId?.[conversationId] ?? false;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    }, 80);
  }, []);

  const markSeen = useCallback(async () => {
    if (!conversationId) return;

    const socket = getChatSocket();
    if (socket?.connected) {
      socket.emit("chat:seen", { conversationId });
      return;
    }

    try {
      await chatApi.markConversationSeen(conversationId);
    } catch (error) {
      console.log(
        "[chat] mark seen fallback error",
        error?.response?.data ?? error?.message ?? error,
      );
    }
  }, [conversationId]);

  const loadConversationMeta = useCallback(async () => {
    if (!conversationId) return;

    try {
      const res = await chatApi.getConversation(conversationId);
      const item = res?.data?.data ?? res?.data ?? res;
      if (item) {
        setConversation(item);
        dispatch(upsertConversation(item));
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Không thể tải thông tin cuộc trò chuyện",
      });
    }
  }, [conversationId, dispatch]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    pageRef.current = 1;
    setHasMore(true);

    dispatch(setLoadingMessages({ conversationId, loading: true }));
    try {
      const res = await chatApi.getMessages(conversationId, 1, LIMIT);
      const items = res?.data?.data ?? res?.data ?? [];
      dispatch(setMessages({ conversationId, messages: items }));
      scrollToBottom();
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Không thể tải lịch sử chat",
      });
    } finally {
      dispatch(setLoadingMessages({ conversationId, loading: false }));
    }
  }, [conversationId, dispatch]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loadingMore) return;

    const nextPage = pageRef.current + 1;
    setLoadingMore(true);

    try {
      const res = await chatApi.getMessages(conversationId, nextPage, LIMIT);
      const items = res?.data?.data ?? res?.data ?? [];

      if (items.length === 0) {
        setHasMore(false);
        return;
      }

      pageRef.current = nextPage;
      setHasMore(items.length === LIMIT);
      const current =
        chatState.messagesByConversationId?.[conversationId] ?? [];
      dispatch(
        setMessages({ conversationId, messages: [...items, ...current] }),
      );
    } finally {
      setLoadingMore(false);
    }
  }, [
    hasMore,
    loadingMore,
    conversationId,
    dispatch,
    chatState.messagesByConversationId,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return undefined;

      let active = true;
      let socket = null;

      const joinRoom = () => {
        const instance = getChatSocket();
        if (instance?.connected) {
          instance.emit("chat:join", { conversationId });
          instance.emit("chat:seen", { conversationId });
        }
      };

      const handleConversationUpserted = (payload) => {
        const item = payload?.conversation ?? payload?.data ?? payload;
        if (!item) return;

        dispatch(upsertConversation(item));
        const payloadConversationId = resolveConversationId(item);
        if (
          payloadConversationId &&
          String(payloadConversationId) === String(conversationId)
        ) {
          setConversation((prev) => ({ ...(prev ?? {}), ...item }));
        }
      };

      const handleMessageNew = (payload) => {
        const message =
          payload?.message ??
          payload?.data?.message ??
          payload?.data ??
          payload ??
          null;
        const payloadConversation =
          payload?.conversation ?? payload?.data?.conversation ?? null;
        const payloadConversationId =
          resolveConversationId(payloadConversation) ??
          message?.conversationId ??
          payload?.conversationId ??
          null;

        if (
          !payloadConversationId ||
          String(payloadConversationId) !== String(conversationId)
        )
          return;

        const foundClientMessageId =
          payload?.clientMessageId ??
          payload?.data?.clientMessageId ??
          message?.clientMessageId ??
          null;

        const normalizedMessage = message?.conversationId
          ? {
              ...(message || {}),
              ...(foundClientMessageId
                ? { clientMessageId: foundClientMessageId }
                : {}),
            }
          : {
              ...message,
              conversationId,
              ...(foundClientMessageId
                ? { clientMessageId: foundClientMessageId }
                : {}),
            };

        dispatch(appendMessage({ conversationId, message: normalizedMessage }));
        dispatch(
          upsertConversation(
            payloadConversation ?? {
              _id: conversationId,
              lastMessage: normalizedMessage,
            },
          ),
        );

        const sender = resolveMessageSender(normalizedMessage);
        if (!isCurrentUser(currentUserKeys, sender)) {
          markSeen();
        }

        scrollToBottom();
      };

      const handleMessageSeen = (payload) => {
        const message =
          payload?.message ??
          payload?.data?.message ??
          payload?.data ??
          payload ??
          null;
        const payloadConversationId =
          resolveConversationId(
            payload?.conversation ?? payload?.data?.conversation ?? null,
          ) ??
          message?.conversationId ??
          payload?.conversationId ??
          null;

        if (
          !payloadConversationId ||
          String(payloadConversationId) !== String(conversationId)
        )
          return;

        dispatch(
          markMessagesSeen({
            conversationId,
            userInfoId: payload?.userInfoId,
          }),
        );
      };

      const bootstrap = async () => {
        dispatch(setActiveConversationId(conversationId));
        socket = await connectChatSocket(accessToken);

        if (!active) return;

        if (socket) {
          socket.on("connect", joinRoom);
          socket.on("reconnect", joinRoom);
          socket.on("conversation:upserted", handleConversationUpserted);
          socket.on("message:new", handleMessageNew);
          socket.on("message:seen", handleMessageSeen);
        }

        await Promise.all([loadConversationMeta(), loadMessages()]);

        if (socket?.connected) {
          joinRoom();
          markSeen();
        }
      };

      bootstrap();

      return () => {
        active = false;
        if (socket) {
          socket.emit("chat:leave", { conversationId });
          socket.off("connect", joinRoom);
          socket.off("reconnect", joinRoom);
          socket.off("conversation:upserted", handleConversationUpserted);
          socket.off("message:new", handleMessageNew);
          socket.off("message:seen", handleMessageSeen);
        }
        dispatch(clearActiveConversationId());
      };
    }, [
      accessToken,
      conversationId,
      currentUserKeys,
      dispatch,
      loadConversationMeta,
      loadMessages,
      markSeen,
      scrollToBottom,
    ]),
  );

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !conversationId || sending) return;

    const clientMessageId = makeClientMessageId();
    const senderId = user?.userInfo ?? {
      _id:
        user?.userInfo?._id ?? user?._id ?? user?.id ?? user?.user_id ?? null,
      id_account:
        user?.userInfo?.id_account ??
        user?.id_account ??
        user?.account?.id ??
        null,
      full_name: user?.full_name ?? "Bạn",
      avatar: user?.avatar ?? null,
      ma_nv: user?.ma_nv ?? "",
    };

    const optimisticMessage = {
      _id: clientMessageId,
      clientMessageId,
      conversationId,
      senderId,
      type: "text",
      content,
      seenBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending",
    };

    setText("");
    setSending(true);
    dispatch(appendMessage({ conversationId, message: optimisticMessage }));
    dispatch(
      upsertConversation({
        _id: conversationId,
        lastMessage: optimisticMessage,
      }),
    );
    scrollToBottom();

    try {
      const socket = getChatSocket();

      if (socket?.connected) {
        socket.emit("chat:send", { conversationId, content, clientMessageId });
      } else {
        const res = await chatApi.sendMessage(conversationId, {
          content,
          clientMessageId,
        });
        const sentMessage = res?.data?.data ?? res?.data ?? res;

        if (sentMessage) {
          if (clientMessageId && !sentMessage.clientMessageId) {
            sentMessage.clientMessageId = clientMessageId;
          }
          dispatch(
            updateMessageStatus({
              conversationId,
              clientMessageId,
              status: "sent",
            }),
          );
          dispatch(appendMessage({ conversationId, message: sentMessage }));
          dispatch(
            upsertConversation({
              _id: conversationId,
              lastMessage: sentMessage,
            }),
          );
        }
      }
    } catch (error) {
      dispatch(
        updateMessageStatus({
          conversationId,
          clientMessageId,
          status: "failed",
          error:
            error?.response?.data?.message ??
            error?.message ??
            "Gửi tin nhắn thất bại",
        }),
      );
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Gửi tin nhắn thất bại",
      });
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const title = resolveConversationTitle(conversation, currentUserKeys);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerSubTitle} numberOfLines={1}>
              {isChatSocketConnected()
                ? "Đang kết nối realtime"
                : "Dùng REST khi socket chưa sẵn sàng"}
            </Text>
          </View>

          <View style={styles.headerStatus}>
            <Ionicons
              name={isChatSocketConnected() ? "radio" : "cloud-outline"}
              size={18}
              color="#0F766E"
            />
          </View>
        </View>

        {loadingMessages && messages.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#0F766E" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={timelineItems}
            keyExtractor={(item, index) => String(item?.key ?? index)}
            renderItem={({ item }) => {
              if (item?.type === "separator") {
                return <DateSeparator label={item.label} />;
              }

              const sender = resolveMessageSender(item.message);
              const isMine = isCurrentUser(currentUserKeys, sender);
              return <MessageBubble item={item.message} isMine={isMine} />;
            }}
            inverted
            onMomentumScrollBegin={() => {
              endReachedDuringMomentumRef.current = false;
            }}
            onEndReached={() => {
              if (
                endReachedDuringMomentumRef.current ||
                loadingMore ||
                !hasMore
              ) {
                return;
              }

              endReachedDuringMomentumRef.current = true;
              loadMore();
            }}
            onEndReachedThreshold={0.2}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadMoreWrap}>
                  <ActivityIndicator size="small" color="#0F766E" />
                </View>
              ) : !hasMore && messages.length > 0 ? (
                <View style={styles.loadMoreWrap}>
                  <Text style={styles.loadMoreText}>
                    Đã tải toàn bộ tin nhắn
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={
              messages.length === 0 ? styles.emptyMessages : styles.messagesList
            }
            onContentSizeChange={() => {
              if (pageRef.current < 1 && messages.length > 0) scrollToBottom();
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={42}
                  color="#9CA3AF"
                />
                <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
                <Text style={styles.emptyText}>
                  Hãy gửi lời chào đầu tiên để bắt đầu cuộc trò chuyện.
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
              maxLength={4000}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!text.trim() || sending) && styles.sendButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  header: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { color: "#111827", fontSize: 17, fontWeight: "700" },
  headerSubTitle: { marginTop: 2, color: "#6B7280", fontSize: 12 },
  headerStatus: { width: 40, alignItems: "flex-end", justifyContent: "center" },
  body: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  messagesList: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
  emptyMessages: { flexGrow: 1, paddingHorizontal: 12, paddingTop: 12 },

  emptyState: {
    flex: 1,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  input: {
    minHeight: 24,
    maxHeight: 120,
    color: "#111827",
    fontSize: 15,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  sendButtonDisabled: { opacity: 0.55 },
  loadMoreWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loadMoreText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});
