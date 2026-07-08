import { useEffect, useState } from "react";
import {
  getChatSocket,
  isChatSocketConnected,
  onChatSocketStatusChange,
} from "../../libs/chatSocket";

// "connected" | "connecting" | "disconnected"
export default function useSocketStatus() {
  const [status, setStatus] = useState(
    isChatSocketConnected() ? "connected" : "connecting",
  );

  useEffect(() => {
    const syncInterval = setInterval(() => {
      const socket = getChatSocket();
      if (socket) {
        setStatus(socket.connected ? "connected" : status);
        clearInterval(syncInterval);
      }
    }, 300);

    const unsubscribe = onChatSocketStatusChange(setStatus);

    return () => {
      clearInterval(syncInterval);
      unsubscribe();
    };
  }, []);

  return status;
}
