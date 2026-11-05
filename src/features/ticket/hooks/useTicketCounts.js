import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "react-redux";
import ticketApi from "../api/ticketApi";
import { useQuery } from "@tanstack/react-query";

// Số ticket cần để ý ở từng tab — làm mới mỗi phút để người trực thấy ticket mới mà không cần kéo tải lại
const useTicketCounts = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  // Màn danh sách vẫn mount khi đang xem chi tiết / trao đổi → chỉ polling lúc màn đang hiện
  const isFocused = useIsFocused();

  const { data: counts = {}, isLoading, refetch } = useQuery({
    queryKey: ["ticket-counts"],
    queryFn: async () => {
      const res = await ticketApi.getCounts();
      return res.data?.data ?? {};
    },
    enabled: !!accessToken,
    refetchInterval: isFocused ? 60_000 : false,
    staleTime: 15_000,
  });

  return { counts, isLoading, refetch };
};

export default useTicketCounts;
