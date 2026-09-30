import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import dayjs from "dayjs";
import { ArrowUpRight, ArrowDownLeft, PhoneCall } from "lucide-react-native";
import { CRM_RADIUS } from "../../crm/theme/colors";

const DIRECTION_META = {
  outbound: { label: "Gọi đi", icon: ArrowUpRight, color: "#2563EB" },
  inbound: { label: "Gọi đến", icon: ArrowDownLeft, color: "#059669" },
  local: { label: "Nội bộ", icon: PhoneCall, color: "#6B7280" },
};

const CallHistoryCard = ({ row, onPress }) => {
  const direction = DIRECTION_META[row.direction] || DIRECTION_META.local;
  const DirectionIcon = direction.icon;
  const answered = (row.answer_sec ?? 0) > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <View style={styles.timeRow}>
          <DirectionIcon size={14} color={direction.color} strokeWidth={3} />
          <Text style={styles.timeText}>{dayjs(row.time_start_call).format("HH:mm DD/MM/YYYY")}</Text>
        </View>
        <View style={[styles.statusBadge, answered ? styles.statusAnswered : styles.statusMissed]}>
          <Text style={[styles.statusText, answered ? styles.statusTextAnswered : styles.statusTextMissed]}>
            {direction.label} / {answered ? "Đã nghe" : "Không trả lời"}
          </Text>
        </View>
      </View>

      <Text style={styles.customerName}>{row.customerName || "Không xác định"}</Text>
      <Text style={styles.customerPhone}>{row.phone_number}</Text>
    </TouchableOpacity>
  );
};

export default CallHistoryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    gap: 6,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 11, fontWeight: "700", color: "#111827" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: CRM_RADIUS.pill, borderWidth: 1 },
  statusAnswered: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  statusMissed: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  statusText: { fontSize: 9, fontWeight: "700" },
  statusTextAnswered: { color: "#047857" },
  statusTextMissed: { color: "#DC2626" },
  customerName: { fontSize: 14, fontWeight: "900", color: "#1F2937", textTransform: "uppercase" },
  customerPhone: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
});
