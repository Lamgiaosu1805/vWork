import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TICKET_YELLOW_COLORS, TICKET_YELLOW_REASON_LABELS } from "../constants";
import { formatAgo, isTicketFinished } from "../lib/ticketFormat";
import { Avatar, StatusPill, Tag, UrgencyPill } from "./TicketBadges";

const APPROVAL_HINT = {
  missing: "Tờ trình: chờ người tạo nộp",
  invalid: "Tờ trình không hợp lệ, cần nộp lại",
  submitted: "Tờ trình cần xác nhận",
};

const TicketCard = ({ ticket, onPress }) => {
  const finished = isTicketFinished(ticket);
  const tags = [ticket.product?.name, ticket.category?.name].filter(Boolean);
  const approvalHint = ticket.approval?.required ? APPROVAL_HINT[ticket.approval.status] : null;

  // Ticket hỗ trợ nội bộ: hiện nhân sự liên quan thay cho khách
  const subject = ticket.customer?.name || ticket.customer?.phone || ticket.relatedEmployee?.name;
  const ownerName = ticket.owner?.name;
  const ownerExtra = ticket.collaboratorCount ? ` +${ticket.collaboratorCount}` : "";
  // Đã giao nhưng chưa có chủ trì: owner chỉ có khi có người bấm Nhận (hoặc người giao chọn sẵn chủ trì)
  const assignedText =
    ticket.assignmentMode === "members"
      ? "Đã giao, chờ người được giao nhận"
      : ticket.assignmentMode === "department"
        ? "Đã giao phòng ban, chờ nhận"
        : null;
  const waitingText = finished ? "Không có người xử lý" : (assignedText ?? "Chưa ai nhận");

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(ticket)}
      style={[
        styles.card,
        ticket.yellow && styles.cardYellow,
        finished && styles.cardFinished,
      ]}
    >
      {ticket.yellow && (
        <View style={styles.yellowBanner}>
          <Ionicons name="warning-outline" size={14} color={TICKET_YELLOW_COLORS.color} />
          <Text style={styles.yellowText} numberOfLines={1}>
            {TICKET_YELLOW_REASON_LABELS[ticket.yellow.reason] ?? "Cần chú ý"}
            {ticket.yellow.since ? ` · ${formatAgo(ticket.yellow.since)}` : ""}
          </Text>
        </View>
      )}

      <View style={styles.topRow}>
        <Text style={styles.code}>{ticket.code}</Text>
        {ticket.restricted && <Ionicons name="lock-closed" size={12} color="#6B7280" />}
        <UrgencyPill urgency={ticket.urgency} />
        <View style={{ flex: 1 }} />
        <StatusPill status={ticket.status} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {ticket.title}
      </Text>

      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </View>
      )}

      {approvalHint && (
        <View style={styles.noticeBox}>
          <Ionicons name="document-text-outline" size={14} color="#9A3412" />
          <Text style={styles.noticeText} numberOfLines={1}>
            {approvalHint}
          </Text>
        </View>
      )}

      {ticket.resolution && (
        <Text style={styles.resolution} numberOfLines={1}>
          Kết quả: {ticket.resolution.label}
        </Text>
      )}

      <View style={styles.divider} />

      <View style={styles.footer}>
        {ownerName || !assignedText ? (
          <Avatar id={ticket.owner?.id} name={ownerName} size={28} />
        ) : (
          <View style={styles.assignedIcon}>
            <Ionicons name="people-outline" size={15} color="#E64A19" />
          </View>
        )}
        <Text style={styles.meta} numberOfLines={1}>
          {ownerName ? (
            <Text style={styles.metaStrong}>
              {ownerName}
              {ownerExtra}
            </Text>
          ) : (
            <Text style={assignedText && !finished ? styles.metaAssigned : undefined}>{waitingText}</Text>
          )}
          {subject ? ` · ${subject}` : ""}
        </Text>
        <Text style={styles.time}>{formatAgo(ticket.lastActivityAt ?? ticket.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(TicketCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: "#101828",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  cardYellow: { borderWidth: 1.5, borderColor: TICKET_YELLOW_COLORS.border },
  cardFinished: { opacity: 0.75 },
  yellowBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: -4,
    marginTop: -4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: TICKET_YELLOW_COLORS.bg,
  },
  yellowText: { fontSize: 12, fontWeight: "600", color: TICKET_YELLOW_COLORS.color, flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  code: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  title: { fontSize: 15, fontWeight: "700", lineHeight: 21, color: "#1A1D26" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
  },
  noticeText: { fontSize: 12, fontWeight: "600", color: "#9A3412", flex: 1 },
  resolution: { fontSize: 12, color: "#4B5563" },
  divider: { height: 1, backgroundColor: "#F0F1F3", marginVertical: 2 },
  footer: { flexDirection: "row", alignItems: "center", gap: 8 },
  meta: { flex: 1, fontSize: 12, color: "#6B7280" },
  metaStrong: { color: "#374151", fontWeight: "600" },
  metaAssigned: { color: "#BF360C", fontWeight: "600" },
  assignedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF3EE",
    alignItems: "center",
    justifyContent: "center",
  },
  time: { fontSize: 12, color: "#6B7280" },
});
