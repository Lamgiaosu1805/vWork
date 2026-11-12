import { getChatSocket } from "../../../libs/chatSocket";
import { ASK_ACK_TIMEOUT_MS, SOCKET_EVENTS } from "../constants";

// Trợ lý dùng chung socket đã xác thực của chat (server gắn danh tính người hỏi từ handshake). Luôn lấy
// instance mới nhất: đổi token thì chatSocket tạo socket MỚI và xoá hết listener của socket cũ.
const handbookSocket = {
  ask: (payload) =>
    new Promise((resolve) => {
      const socket = getChatSocket();
      // socket.io đệm emit lúc mất kết nối rồi gửi bù khi nối lại: app đã báo lỗi mà server vẫn tạo câu hỏi.
      if (!socket?.connected) {
        resolve({ ok: false, code: "NETWORK" });
        return;
      }
      socket.timeout(ASK_ACK_TIMEOUT_MS).emit(SOCKET_EVENTS.ASK, payload, (err, ack) => {
        if (err) resolve({ ok: false, code: "NETWORK" });
        else resolve(ack ?? { ok: false, code: "UNKNOWN" });
      });
    }),

  cancel: (payload) => {
    getChatSocket()?.emit(SOCKET_EVENTS.CANCEL, payload);
  },

  isConnected: () => Boolean(getChatSocket()?.connected),
};

export default handbookSocket;
