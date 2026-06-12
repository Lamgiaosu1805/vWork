import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";

const getInitials = (name = "") => {
  if (!name) return "KH";
  return name
    .trim()
    .split(" ")
    .slice(-2)
    .map((i) => i[0])
    .join("")
    .toUpperCase();
};

export default function SaleCard({ staff }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sale phụ trách</Text>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(staff?.full_name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{staff?.full_name || "--"}</Text>
          <Text style={styles.role}>
            {staff?.department
              ?.map(
                (item) =>
                  `${item?.position?.position_name} - ${item?.department?.department_name}`,
              )
              .join("\n")}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.btn}
        onPress={() =>
          Toast.show({ type: "info", text1: "Tính năng đang phát triển" })
        }
      >
        <Text style={styles.btnText}>Chuyển sale</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "700", color: "#111827" },
  role: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  btn: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#D97706", fontWeight: "700" },
});
