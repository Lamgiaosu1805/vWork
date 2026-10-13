import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { CRM_RADIUS } from "../../crm/theme/colors";

const ITEMS = [
  { key: "total", label: "Tổng khách", color: "#1F2937", bg: "#fff" },
  { key: "not_contacted", label: "Chưa liên hệ", color: "#1D4ED8", bg: "#EFF6FF" },
  { key: "overdue", label: "Quá hạn", color: "#B91C1C", bg: "#FEF2F2" },
  { key: "appointments_today", label: "Hẹn hôm nay", color: "#047857", bg: "#ECFDF5" },
];

const CareSummaryCards = ({ summary }) => (
  <View style={styles.row}>
    {ITEMS.map((it) => (
      <View key={it.key} style={[styles.card, { backgroundColor: it.bg }]}>
        <Text style={[styles.value, { color: it.color }]}>{summary?.[it.key] ?? 0}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {it.label}
        </Text>
      </View>
    ))}
  </View>
);

export default CareSummaryCards;

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  card: { flex: 1, borderRadius: CRM_RADIUS.md, paddingVertical: 12, paddingHorizontal: 6, alignItems: "center", borderWidth: 1, borderColor: "#F3F4F6" },
  value: { fontSize: 20, fontWeight: "900" },
  label: { fontSize: 10, fontWeight: "700", color: "#6B7280", marginTop: 2 },
});
