import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { PhoneCall } from "lucide-react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";

const STATUS_LABELS = {
  chua_ekyc: "Chưa eKYC",
  ekyc_chua_dt: "eKYC chưa ĐT",
  dang_dau_tu: "Đang đầu tư",
  da_tat_toan: "Đã tất toán",
  khac: "Khác",
};

const CustomerCallCard = ({ row, onPress, onCallPress }) => {
  const name = row.identity?.full_name || row.phone_number || "N/A";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.phone}>{row.phone_number}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{STATUS_LABELS[row.derivedStatus] || row.derivedStatus}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.callBtn} onPress={onCallPress} activeOpacity={0.8}>
        <PhoneCall size={18} color="#2563EB" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default CustomerCallCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  name: { fontSize: 14, fontWeight: "700", color: "#111827" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  phone: { fontSize: 12, fontWeight: "700", color: "#4B5563" },
  badge: {
    borderWidth: 1,
    borderColor: "#FED7AA",
    backgroundColor: "#FFF3EE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: CRM_RADIUS.pill,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: CRM_COLORS.primary },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: CRM_RADIUS.md,
    backgroundColor: "rgba(37,99,235,0.06)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
