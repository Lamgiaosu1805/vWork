import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { formatRevenueCompact } from "../../../utils/crmUtils";

const { width } = Dimensions.get("window");

export default function CustomerStats({ detail }) {
  const stats = [
    {
      label: "Tổng tài sản",
      value: formatRevenueCompact(detail?.totalAssets || 0),
    },
    { label: "Số dư", value: formatRevenueCompact(detail?.money || 0) },
    { label: "Điểm thưởng", value: detail?.loyaltyPoint || "0" },
    { label: "Giới thiệu", value: detail?.totalRef || "0" },
  ];

  return (
    <View style={styles.wrap}>
      {stats.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.card}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value} numberOfLines={2}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  card: {
    width: (width - 36) / 2,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  label: { fontSize: 12, color: "#9CA3AF", marginBottom: 6 },
  value: { fontSize: 15, fontWeight: "700", color: "#111827" },
});
