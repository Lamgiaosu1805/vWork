import React from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatShortDate } from "../../lib/ticketFormat";

// Danh sách thao tác theo ticket.capabilities (server quyết định) — key trùng với tên sheet ở màn chi tiết
export const buildTicketMenu = (ticket) => {
  const can = ticket?.capabilities ?? {};
  const working = [
    can.requestInfo && {
      key: "requestInfo",
      icon: "document-text-outline",
      bg: "#FEF3C7",
      color: "#B45309",
      title: "Yêu cầu bổ sung",
      desc: "Hỏi người tạo thêm giấy tờ, thông tin",
    },
    can.setDueHint && {
      key: "dueHint",
      icon: "calendar-outline",
      bg: "#EFF3FF",
      color: "#1D4ED8",
      title: "Đổi ngày dự kiến",
      desc: ticket.dueHintAt ? `Hiện tại: ${formatShortDate(ticket.dueHintAt)}` : "Chưa đặt ngày dự kiến",
    },
    can.manageCollaborators && {
      key: "collaborator",
      icon: "person-add-outline",
      bg: "#ECFDF5",
      color: "#059669",
      title: "Thêm người phối hợp",
      desc: "Mời đồng nghiệp cùng xử lý",
    },
    can.assign && {
      key: "assign",
      icon: "people-outline",
      bg: "#FFF3EE",
      color: "#E64A19",
      title: "Giao việc",
      desc: "Giao cho phòng ban hoặc người cụ thể",
    },
    can.hold && {
      key: "hold",
      icon: "pause-circle-outline",
      bg: "#F5F3FF",
      color: "#6D28D9",
      title: "Tạm hoãn",
      desc: "Nhập lý do và ngày dự kiến tiếp tục",
    },
    can.resume && {
      key: "resume",
      icon: "play-circle-outline",
      bg: "#DBEAFE",
      color: "#1D4ED8",
      title: "Tiếp tục xử lý",
      desc: "Đưa ticket về trạng thái Đang xử lý",
    },
    can.linkRelated && {
      key: "link",
      icon: "link-outline",
      bg: "#F3F4F6",
      color: "#374151",
      title: "Liên kết ticket",
      desc: "Gắn với ticket liên quan hoặc trùng",
    },
  ].filter(Boolean);

  const ending = [
    can.resolve && {
      key: "resolve",
      icon: "checkmark",
      bg: "#DCFCE7",
      color: "#15803D",
      title: "Báo xử lý xong",
      desc: "Chờ người tạo xác nhận",
    },
    can.confirm && {
      key: "confirm",
      icon: "checkmark-done",
      bg: "#DCFCE7",
      color: "#15803D",
      title: "Xác nhận đã xong",
      desc: "Đóng ticket, kết quả Đã giải quyết",
    },
    can.close && {
      key: "close",
      icon: "lock-closed-outline",
      bg: "#E5E7EB",
      color: "#374151",
      title: "Đóng ticket",
      desc: "Không xử lý, trùng, không đủ căn cứ…",
    },
    can.reopen && {
      key: "reopen",
      icon: "refresh",
      bg: "#FFF7ED",
      color: "#C2410C",
      title: "Mở lại ticket",
      desc: "Vấn đề chưa được giải quyết",
    },
    can.release && {
      key: "release",
      icon: "return-down-back",
      bg: "#FEF2F2",
      color: "#DC2626",
      danger: true,
      title: "Trả lại ticket",
      desc: "Bỏ nhận, ticket về trạng thái chưa ai nhận",
    },
    can.cancel && {
      key: "cancel",
      icon: "close-circle-outline",
      bg: "#FEF2F2",
      color: "#DC2626",
      danger: true,
      title: "Huỷ ticket",
      desc: "Không cần xử lý nữa",
    },
  ].filter(Boolean);

  return { working, ending };
};

const roleOf = (ticket, employeeId) => {
  if (!employeeId) return "";
  if (ticket.assignment?.owner?.id === employeeId) return "Bạn là chủ trì";
  if (ticket.assignment?.collaborators?.some((item) => item.id === employeeId)) return "Bạn là người phối hợp";
  if (ticket.createdBy?.id === employeeId) return "Bạn là người tạo";
  return "";
};

const Item = ({ item, onPress }) => (
  <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => onPress(item.key)}>
    <View style={[styles.icon, { backgroundColor: item.bg }]}>
      <Ionicons name={item.icon} size={20} color={item.color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.itemTitle, item.danger && { color: "#DC2626" }]}>{item.title}</Text>
      <Text style={styles.itemDesc}>{item.desc}</Text>
    </View>
  </TouchableOpacity>
);

const TicketActionsMenu = ({ visible, onClose, ticket, employeeId, onSelect }) => {
  const insets = useSafeAreaInsets();
  const { working, ending } = buildTicketMenu(ticket);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Thao tác</Text>
            <Text style={styles.role}>{roleOf(ticket, employeeId)}</Text>
          </View>

          {working.length > 0 && <Text style={styles.group}>Đang xử lý</Text>}
          {working.map((item) => (
            <Item key={item.key} item={item} onPress={onSelect} />
          ))}

          {working.length > 0 && ending.length > 0 && <View style={styles.divider} />}
          {ending.length > 0 && <Text style={styles.group}>Kết thúc</Text>}
          {ending.map((item) => (
            <Item key={item.key} item={item} onPress={onSelect} />
          ))}

          {working.length === 0 && ending.length === 0 && (
            <Text style={styles.empty}>Bạn không có thao tác nào với ticket này</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default TicketActionsMenu;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.45)" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  title: { fontSize: 17, fontWeight: "800", color: "#1A1D26" },
  role: { fontSize: 12, color: "#6B7280" },
  group: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 2,
    marginHorizontal: 4,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 4 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#1A1D26" },
  itemDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F0F1F3", marginVertical: 6 },
  empty: { textAlign: "center", color: "#9CA3AF", paddingVertical: 24 },
});
