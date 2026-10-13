import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { memo } from "react";
import { CalendarClock, ClipboardList, Clock, Flame, PhoneCall } from "lucide-react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import { CHANNEL_LABELS, CUSTOMER_STATUS_LABELS, PRIORITY_META } from "../lib/labels";
import { customerNameOf, formatMoment, getSlaView } from "../lib/sla";

const TONE_COLORS = {
  danger: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  warning: { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  info: { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  success: { color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" },
};

const CareQueueCard = ({ item, now, onPress, onCall, onReport }) => {
  const customer = item.customer_id ?? {};
  const priority = PRIORITY_META[item.priority_class] ?? PRIORITY_META.B;
  const view = getSlaView(item, now);
  const tone = TONE_COLORS[view.tone];
  const isHot = item.priority_class === "A";
  const appointmentUpcoming = item.appointment_at && new Date(item.appointment_at).getTime() > now;

  return (
    <TouchableOpacity
      style={[styles.card, view.tone === "danger" && styles.cardDanger]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.priorityBadge, { backgroundColor: priority.bg, borderColor: priority.border }]}>
          {isHot && <Flame size={12} color={priority.color} />}
          <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
        </View>
        <Text style={styles.channel}>{CHANNEL_LABELS[item.channel] ?? item.channel}</Text>
        {item.round > 1 && <Text style={styles.channel}>· Vòng {item.round}</Text>}
        <View style={{ flex: 1 }} />
        {!!CUSTOMER_STATUS_LABELS[customer.status] && (
          <Text style={styles.status}>{CUSTOMER_STATUS_LABELS[customer.status]}</Text>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {customerNameOf(customer)}
      </Text>
      {!!customer.phone_number && <Text style={styles.phone}>{customer.phone_number}</Text>}

      <View style={[styles.slaBox, { backgroundColor: tone.bg, borderColor: tone.border }]}>
        <View style={styles.slaRow}>
          <Clock size={14} color={tone.color} />
          <Text style={[styles.slaHeadline, { color: tone.color }]}>{view.headline}</Text>
        </View>
        {!!view.subline && <Text style={[styles.slaSub, { color: tone.color }]}>{view.subline}</Text>}
        {!!view.revokeText && <Text style={styles.slaMeta}>{view.revokeText}</Text>}
        {!!item.first_contact_at && (
          <Text style={styles.slaMeta}>
            Liên hệ lần đầu lúc {formatMoment(item.first_contact_at, now)}
            {item.first_contact_breached ? " (trễ hạn)" : ""}
          </Text>
        )}
        {item.attempt_count > 0 && <Text style={styles.slaMeta}>Đã gọi {item.attempt_count} lần</Text>}
      </View>

      {!!item.appointment_at && (
        <View style={styles.appointmentRow}>
          <CalendarClock size={14} color={appointmentUpcoming ? CRM_COLORS.accent : "#9CA3AF"} />
          <Text style={[styles.appointmentText, !appointmentUpcoming && styles.appointmentPast]}>
            Lịch hẹn: {formatMoment(item.appointment_at, now)}
            {appointmentUpcoming ? "" : " (đã qua)"}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} activeOpacity={0.85} onPress={onCall}>
          <PhoneCall size={16} color="#fff" />
          <Text style={styles.callText}>Gọi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.reportBtn]} activeOpacity={0.85} onPress={onReport}>
          <ClipboardList size={16} color={CRM_COLORS.primary} />
          <Text style={styles.reportText}>Báo cáo</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default memo(CareQueueCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardDanger: { borderColor: "#FCA5A5" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: CRM_RADIUS.pill, borderWidth: 1 },
  priorityText: { fontSize: 11, fontWeight: "800" },
  channel: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
  status: { fontSize: 10, fontWeight: "700", color: "#6B7280" },
  name: { fontSize: 15, fontWeight: "800", color: "#111827" },
  phone: { fontSize: 13, fontWeight: "600", color: "#4B5563", marginTop: 2 },
  slaBox: { marginTop: 10, borderRadius: CRM_RADIUS.sm, borderWidth: 1, padding: 10, gap: 3 },
  slaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  slaHeadline: { fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] },
  slaSub: { fontSize: 12, fontWeight: "600", fontVariant: ["tabular-nums"] },
  slaMeta: { fontSize: 11, color: "#4B5563" },
  appointmentRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  appointmentText: { fontSize: 12, fontWeight: "600", color: CRM_COLORS.accent },
  appointmentPast: { color: "#9CA3AF" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: CRM_RADIUS.md },
  callBtn: { backgroundColor: "#2563EB" },
  callText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  reportBtn: { backgroundColor: "#FFF3EE", borderWidth: 1, borderColor: "#FFE3D5" },
  reportText: { color: CRM_COLORS.primary, fontWeight: "800", fontSize: 13 },
});
