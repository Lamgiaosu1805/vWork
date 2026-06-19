import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const OptionRow = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress}>
      <View style={styles.optionIconWrap}>
        <Ionicons name={icon} size={20} color={'#0F766E'} />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

export default OptionRow;

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionLabel: { flex: 1, fontSize: 15, color: "#111827" },
});
