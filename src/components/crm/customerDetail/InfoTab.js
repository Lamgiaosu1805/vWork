import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EkycImagesCard from "./EkycImagesCard";
import SaleCard from "./SaleCard";

const PRIMARY = "#ED2E30";

const formatGender = (g) => (g === 1 ? "Nam" : g === 2 ? "Nữ" : "Khác");

export default function InfoTab({ detail, accessToken, staff }) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
        <InfoItem
          icon="person-outline"
          label="Giới tính"
          value={formatGender(detail?.gender)}
        />
        <InfoItem
          icon="call-outline"
          label="Số điện thoại"
          value={detail?.userName}
        />
        <InfoItem icon="mail-outline" label="Email" value={detail?.email} />
        <InfoItem
          icon="card-outline"
          label="CMND/CCCD"
          value={detail?.legalId}
        />
        <InfoItem
          icon="calendar-outline"
          label="Ngày sinh"
          value={detail?.birthday}
        />
        <InfoItem
          icon="location-outline"
          label="Địa chỉ"
          value={detail?.domicile}
        />
        <InfoItem
          icon="business-outline"
          label="Nơi cấp"
          value={detail?.legalPlace}
        />
      </View>

      <EkycImagesCard detail={detail} accessToken={accessToken} />
      <SaleCard staff={staff} />
    </>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={18} color={PRIMARY} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "--"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
    alignItems: "flex-start",
  },
  infoLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 3 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "600" },
});
