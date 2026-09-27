import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const MenuItem = ({
  icon,
  label,
  onPress,
  danger = false,
  iconBg = "teal",
  showChevron = true,
}) => {
  const iconBgStyle =
    iconBg === "red"
      ? styles.iconRed
      : iconBg === "gray"
        ? styles.iconGray
        : styles.iconTeal;
  const iconColor =
    iconBg === "red" ? "#EF4444" : iconBg === "gray" ? "#6B7280" : "#0F766E";

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, iconBgStyle]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
      {showChevron && (
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );
};

export default MenuItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTeal: { backgroundColor: "#F0FDFA" },
  iconGray: { backgroundColor: "#F3F4F6" },
  iconRed: { backgroundColor: "#FEF2F2" },
  label: { flex: 1, fontSize: 14, color: "#374151" },
  labelDanger: { color: "#EF4444" },
});
