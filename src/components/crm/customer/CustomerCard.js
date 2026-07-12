import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";

const getEkycColor = (ekyc) =>
  ekyc === "Chưa xác thực" ? "#F59E0B" : "#10B981";

const getDisplayName = (row) =>
  row.identity?.full_name || row.phone_number || "N/A";
const TAG_LABELS = {
  not_kyc: "Chưa eKYC",
  kyc_verified_no_investment: "Đã eKYC, chưa đầu tư",
  active_investor: "Đang đầu tư",
  settled: "Đã tất toán",
  upsale: "Up-sale",
  cross_sale: "Cross-sale",
  collaborator: "CTV",
  agent: "Đại lý",
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
          <Text style={styles.avatarText}>{row.identity?.full_name ? row.identity.full_name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "NA"}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.cardPhone}>{row.phone_number}</Text>
        </View>
        <View style={styles.badgeWrap}><Text style={styles.sourceText}>{row.source_type === "sale" ? "Sale" : row.source_type === "agent" ? "Đại lý" : "Marketing"}</Text></View>
      </View>

      <View style={styles.tagsWrap}>
        {[...(row.status_tags || []), ...(row.behavior_tags || []), ...(row.role_tags || [])].map((tag) => (
          <View key={tag} style={styles.tag}><Text style={styles.tagText}>{TAG_LABELS[tag] || tag}</Text></View>
        ))}
      </View>

      <Text style={styles.saleText}>Người giới thiệu: {row.referred_by?.full_name || "Chưa có"}</Text>

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
  sourceText: { fontSize: 11, fontWeight: "700", color: "#5B5BD6", backgroundColor: "#F1EFFE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: "700", color: "#4B5563" },
  saleText: { fontSize: 11, color: "#6B7280", marginTop: 8 },
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
