// Sau mỗi thao tác: chi tiết, danh sách và số đếm đều có thể đổi (trạng thái, người xử lý, tab ticket nằm)
const invalidateTicket = (queryClient, id) => {
  if (id) queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
  // Danh sách (nhiều trang) + số đếm chỉ đánh dấu cũ, không tải ngay: màn danh sách nằm dưới stack sẽ tự tải lại
  // một lần khi người dùng quay về (useRefetchStaleOnFocus) thay vì tải lại sau mỗi thao tác / tin nhắn.
  queryClient.invalidateQueries({ queryKey: ["tickets"], refetchType: "none" });
  queryClient.invalidateQueries({ queryKey: ["ticket-counts"], refetchType: "none" });
};

export default invalidateTicket;
