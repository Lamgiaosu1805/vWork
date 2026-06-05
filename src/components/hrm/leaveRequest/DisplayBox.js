import { StyleSheet, Text, View } from "react-native";
import React from "react";

const DisplayBox = ({ label, value, placeholder }) => {
  return (
    <View style={[styles.fieldGroup, { flex: 1 }]}>
      {label ? <Text style={styles.fieldLabel}>{label}*</Text> : null}
      <View style={styles.displayBox}>
        <Text style={{ color: value ? "#2A2A2A" : "#9CA3AF", fontSize: 14 }}>
          {value || placeholder}
        </Text>
      </View>
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
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
});
