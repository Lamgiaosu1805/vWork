import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const DisplayBox = ({ label, value, placeholder, onPress }) => {
  return (
    <View style={[styles.fieldGroup, { flex: 1 }]}>
      {label ? <Text style={styles.fieldLabel}>{label}*</Text> : null}
      <TouchableOpacity
        style={styles.displayBox}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!onPress}
      >
        <Text style={{ color: value ? "#2A2A2A" : "#9CA3AF", fontSize: 14 }}>
          {value || placeholder}
        </Text>
        {onPress ? (
          <Ionicons name="calendar-outline" size={16} color={"#9CA3AF"} />
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

export default DisplayBox;

const styles = StyleSheet.create({
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 6,
  },
  displayBox: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
