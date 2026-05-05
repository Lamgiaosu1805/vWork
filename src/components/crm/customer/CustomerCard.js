import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";

const getEkycColor = (ekyc) =>
  ekyc === "Chưa xác thực" ? "#F59E0B" : "#10B981";

const getTypeColor = (type) => {
  if (type === "VIP") return "#EF4444";
  if (type === "Thường") return "#3B82F6";
  return "#10B981";
};

const getDisplayName = (row) =>
  row.identity?.full_name || row.phone_number || "N/A";
const getDisplayType = (row) => {
  if (row.status === "registered") return "Tiềm năng";
  if (row.status === "kyc_verified") return "Thường";
  return "VIP";
};
const getDisplayEkyc = (row) =>
  row.identity?.verified_at ? "Đã xác thực" : "Chưa xác thực";
const getDisplayGender = (row) => {
  const g = (row.identity?.gender || "").toLowerCase();
  if (g === "male" || g === "nam") return "Nam";
  if (g === "female" || g === "nu" || g === "nữ") return "Nữ";
  return "N/A";
};

const MetaItem = ({ icon, label }) => (
  <View style={styles.metaItem}>
    <Feather name={icon} size={13} color="#9CA3AF" />
    <Text style={styles.metaText}>{label}</Text>
  </View>
);

const CustomerCard = ({ row, onPress }) => {
  const name = getDisplayName(row);
  const type = getDisplayType(row);
  const ekyc = getDisplayEkyc(row);
  const gender = getDisplayGender(row);
  const date = row.createdAt
    ? new Date(row.createdAt).toLocaleDateString("vi-VN")
    : "N/A";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>N/A</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.cardPhone}>{row.phone_number}</Text>
        </View>
        <View style={styles.badgeWrap}>
          <Text style={[styles.typeBadge, { color: getTypeColor(type) }]}>
            {type}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Meta row */}
      <View style={styles.cardMeta}>
        <MetaItem icon="user" label={gender} />
        <MetaItem icon="calendar" label={date} />
        <View style={styles.metaItem}>
          <Feather name="shield" size={13} color={getEkycColor(ekyc)} />
          <Text
            style={[
              styles.metaText,
              { color: getEkycColor(ekyc), fontWeight: "600" },
            ]}
          >
            {ekyc}
          </Text>
        </View>
      </View>

      {/* View detail button */}
      <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
        <Feather name="file-text" size={14} color="#2563EB" />
        <Text style={styles.detailBtnText}>Xem chi tiết</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default CustomerCard;

const styles = StyleSheet.create({
  // Customer card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    padding: 14,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardPhone: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  badgeWrap: {
    marginLeft: "auto",
  },
  typeBadge: {
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 16,
    minHeight: 24,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 10,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "rgba(37, 99, 235, 0.07)",
  },
  detailBtnText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
});
