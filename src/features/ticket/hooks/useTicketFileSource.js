import { useCallback } from "react";
import { useSelector } from "react-redux";
import ticketApi from "../api/ticketApi";

// Route tải file ticket cần Bearer token — trả source cho Image / ImageView / Pdf / WebView kèm header
const useTicketFileSource = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  return useCallback(
    (ticketId, attachmentId) => ({
      uri: ticketApi.attachmentUrl(ticketId, attachmentId),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    [accessToken],
  );
};

export default useTicketFileSource;
