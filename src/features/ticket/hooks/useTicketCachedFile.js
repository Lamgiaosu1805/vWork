import { useQuery } from "@tanstack/react-query";
import { downloadTicketFile, writeVideoPage } from "../lib/ticketFileCache";
import useTicketFileSource from "./useTicketFileSource";

// File cần tải về máy trước khi xem (Office, video): mở lại cùng file thì lấy ngay từ cache, không tải lại.
// localUri (file vừa chọn, chưa gửi) thì không cần tải, chỉ tạo trang phát nếu là video.
const useTicketCachedFile = ({ ticketId, attachmentId, fileName, localUri, isVideo, enabled }) => {
  const sourceOf = useTicketFileSource();

  return useQuery({
    queryKey: ["ticket-file", localUri || `${ticketId}/${attachmentId}`, isVideo],
    queryFn: async () => {
      const fileUri =
        localUri ||
        (await downloadTicketFile({ ...sourceOf(ticketId, attachmentId), attachmentId, fileName }));
      const videoPage = isVideo ? await writeVideoPage(fileUri, attachmentId || fileName) : null;
      return { fileUri, videoPage };
    },
    enabled,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
};

export default useTicketCachedFile;
