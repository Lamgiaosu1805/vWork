import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  TICKET_ACTIVITY_LABELS,
  TICKET_FIELD_LABELS,
  TICKET_STATUS_CONFIG,
  TICKET_URGENCY_CONFIG,
} from "../../constants";
import { formatDate, formatDateTime } from "../../lib/ticketFormat";

const ACTIVITY_ICON = {
  created: { name: "add", bg: "#FFF3EE", color: "#E64A19" },
  claimed: { name: "hand-left-outline", bg: "#DBEAFE", color: "#1D4ED8" },
  released: { name: "return-down-back", bg: "#FEF2F2", color: "#DC2626" },
  assigned: { name: "people-outline", bg: "#ECFDF5", color: "#059669" },
  collaborator_added: { name: "person-add-outline", bg: "#ECFDF5", color: "#059669" },
  collaborator_removed: { name: "person-remove-outline", bg: "#F3F4F6", color: "#4B5563" },
  info_requested: { name: "document-text-outline", bg: "#FEF3C7", color: "#B45309" },
  info_submitted: { name: "cloud-upload-outline", bg: "#EFF3FF", color: "#1D4ED8" },
  approval_verified: { name: "shield-checkmark-outline", bg: "#DCFCE7", color: "#15803D" },
  approval_invalid: { name: "shield-outline", bg: "#FEE2E2", color: "#B91C1C" },
  on_hold: { name: "pause", bg: "#F5F3FF", color: "#6D28D9" },
  resumed: { name: "play", bg: "#DBEAFE", color: "#1D4ED8" },
  resolved: { name: "checkmark", bg: "#DCFCE7", color: "#15803D" },
  closed: { name: "lock-closed-outline", bg: "#E5E7EB", color: "#374151" },
  auto_closed: { name: "lock-closed-outline", bg: "#E5E7EB", color: "#374151" },
  confirmed: { name: "checkmark-done", bg: "#DCFCE7", color: "#15803D" },
  reopened: { name: "refresh", bg: "#FFF7ED", color: "#C2410C" },
  cancelled: { name: "close", bg: "#E5E7EB", color: "#6B7280" },
  edited: { name: "create-outline", bg: "#F3F4F6", color: "#4B5563" },
  due_hint_set: { name: "calendar-outline", bg: "#FFF7ED", color: "#9A3412" },
  linked: { name: "link-outline", bg: "#F3F4F6", color: "#374151" },
  message: { name: "chatbubble-outline", bg: "#EFF3FF", color: "#1D4ED8" },
};

const detailOf = (activity) => {
  const parts = [];
  if (activity.from && activity.to && TICKET_STATUS_CONFIG[activity.to]) {
    parts.push(
      `${TICKET_STATUS_CONFIG[activity.from]?.label ?? activity.from} → ${TICKET_STATUS_CONFIG[activity.to].label}`,
    );
  }
  if (activity.note) {
    parts.push(activity.action === "due_hint_set" ? `Lý do: ${activity.note}` : activity.note);
  }
  (activity.changes ?? []).forEach((change) => {
    const label = TICKET_FIELD_LABELS[change.field] ?? change.field;
    if (change.field === "dueHintAt") {
      parts.push(
        change.from
          ? `${label}: ${formatDate(change.from)} → ${formatDate(change.to)}`
          : `${label} → ${formatDate(change.to)}`,
      );
    } else if (change.field === "urgency") {
      parts.push(`${label}: ${TICKET_URGENCY_CONFIG[change.to]?.label ?? change.to}`);
    } else if (typeof change.to === "string" || typeof change.to === "number") {
      parts.push(`${label}: ${change.to}`);
    } else {
      parts.push(`Đã sửa ${label.toLowerCase()}`);
    }
  });
  return parts.join("\n");
};

const TicketHistoryTab = ({ activities = [] }) => {
  const items = [...activities].reverse();

  if (items.length === 0) {
    return <Text style={styles.empty}>Chưa có lịch sử thao tác</Text>;
  }

  return (
    <View style={styles.card}>
      {items.map((activity, index) => {
        const icon = ACTIVITY_ICON[activity.action] ?? ACTIVITY_ICON.edited;
        const last = index === items.length - 1;
        const detail = detailOf(activity);
        return (
          <View key={activity.id} style={styles.item}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: icon.bg }]}>
                <Ionicons name={icon.name} size={14} color={icon.color} />
              </View>
              {!last && <View style={styles.line} />}
            </View>
            <View style={[styles.content, !last && { paddingBottom: 18 }]}>
              <Text style={styles.title}>{TICKET_ACTIVITY_LABELS[activity.action] ?? activity.action}</Text>
              {!!detail && (
                <Text style={styles.detail} numberOfLines={6}>
                  {detail}
                </Text>
              )}
              <Text style={styles.meta}>
                {activity.actor?.name || "Hệ thống"} · {formatDateTime(activity.createdAt)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default TicketHistoryTab;

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14 },
  item: { flexDirection: "row", gap: 12 },
  rail: { width: 28, alignItems: "center" },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  line: { flex: 1, width: 2, backgroundColor: "#E5E7EB", marginVertical: 2 },
  content: { flex: 1, paddingTop: 4, gap: 3 },
  title: { fontSize: 14, fontWeight: "700", color: "#1A1D26" },
  detail: { fontSize: 13, color: "#374151", lineHeight: 19 },
  meta: { fontSize: 12, color: "#6B7280" },
  empty: { textAlign: "center", color: "#9CA3AF", paddingVertical: 40 },
});
