import { useState } from "react";
import Toast from "react-native-toast-message";
import { errorMessageOf } from "../lib/ticketFormat";
import useTicketAction from "./useTicketAction";

// Chạy một thao tác từ sheet: gắn version đang hiển thị, báo Toast khi xong, giữ lỗi để sheet hiện ngay dưới form.
// Trả về null khi thành công, chuỗi lỗi khi thất bại (nơi không có sheet tự hiện lỗi bằng Toast).
const useTicketActionRunner = (ticket) => {
  const { mutateAsync, isPending } = useTicketAction(ticket?.id);
  const [error, setError] = useState("");

  const run = async (action, body = {}, onDone) => {
    setError("");
    try {
      const res = await mutateAsync({ action, body: { ...body, version: ticket.version } });
      Toast.show({ type: "success", text1: res?.message ?? "Đã cập nhật ticket" });
      onDone?.(res);
      return null;
    } catch (err) {
      const message = errorMessageOf(err);
      setError(message);
      return message;
    }
  };

  return { run, isPending, error, setError };
};

export default useTicketActionRunner;
