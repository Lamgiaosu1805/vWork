export const CALL_ERROR_MESSAGES = {
  // OmiStartCallStatus
  0: "UUID người dùng không hợp lệ.",
  1: "Số điện thoại không đúng định dạng.",
  2: "Không thể gọi chính số của bạn.",
  3: "Đã vượt quá số lần thử.",
  4: "Không có quyền thực hiện.",
  5: "Không tìm thấy tài khoản SIP.",
  6: "Đăng ký SIP thất bại.",
  7: "Không thể khởi tạo cuộc gọi.",
  8: "Khởi tạo cuộc gọi thành công.",
  9: "Đang có cuộc gọi khác.",
  10: "Số nội bộ đã bị khóa.",
  11: "Không có kết nối mạng.",

  450: "Ứng dụng chưa được cấp quyền Micro.",
  451: "Ứng dụng chưa được cấp quyền Camera.",
  452: "Ứng dụng chưa được cấp quyền Hiển thị trên ứng dụng khác.",

  // SIP
  200: "Cuộc gọi đã kết thúc.",
  408: "Không có người trả lời.",
  480: "Thuê bao tạm thời không liên lạc được.",
  486: "Thuê bao đang bận.",
  487: "Cuộc gọi đã bị hủy.",
  500: "Lỗi máy chủ.",
  503: "Máy chủ hiện không khả dụng.",

  // OMICALL
  600: "Cuộc gọi bị từ chối.",
  601: "Khách hàng đã kết thúc cuộc gọi.",
  602: "Cuộc gọi đã được nhận trên thiết bị khác.",
  603: "Cuộc gọi đã bị từ chối.",

  // PBX
  850: "Đã vượt quá số cuộc gọi đồng thời.",
  851: "Đã vượt quá giới hạn cuộc gọi.",
  852: "Tài khoản chưa có gói dịch vụ.",
  853: "Số nội bộ đã bị khóa.",
  854: "Số điện thoại nằm trong danh sách DNC.",
  855: "Đã vượt quá số cuộc gọi của gói dùng thử.",
  856: "Đã vượt quá số phút gọi của gói dùng thử.",
  857: "Số điện thoại đã bị chặn.",
  858: "Đầu số chưa được cấu hình.",
  859: "Không còn số Viettel để gọi.",
  860: "Không còn số Vinaphone để gọi.",
  861: "Không còn số Mobifone để gọi.",
  862: "Đầu số Viettel đang bị khóa tạm thời.",
  863: "Đầu số Vinaphone đang bị khóa tạm thời.",
  864: "Đầu số Mobifone đang bị khóa tạm thời.",
  865: "Không được phép gọi quảng cáo vào thời điểm này.",
};

export const ERROR_MESSAGES = {
  400: "Thiếu tham số bắt buộc, kiểm tra lại cấu hình.",
  401: "Sai tài khoản/mật khẩu SIP.",
  450: "Thiếu quyền micro (RECORD_AUDIO).",
  451: "Thiếu quyền foreground service.",
  452: "Thiếu quyền thông báo.",
  500: "Không khởi động được SIP service.",
  501: "SIP service không khả dụng.",
  600: "Không có kết nối mạng.",
  601: "Kết nối SIP bị timeout.",
};
