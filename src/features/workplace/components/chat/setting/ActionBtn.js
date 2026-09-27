import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const ActionBtn = ({ icon, label, onPress, danger = false }) => {
  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.icon, danger ? styles.iconDanger : styles.iconTeal]}>
        <Ionicons
          name={icon}
          size={21}
          color={danger ? "#EF4444" : "#0F766E"}
        />
      </View>
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default ActionBtn;

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 7, minWidth: 58 },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTeal: { backgroundColor: "#F0FDFA" },
  iconDanger: { backgroundColor: "#FEF2F2" },
  label: { fontSize: 12, fontWeight: "500", color: "#6B7280" },
  labelDanger: { color: "#EF4444" },
});
