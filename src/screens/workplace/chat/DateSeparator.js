import { StyleSheet, Text, View } from "react-native";
import React from "react";

const DateSeparator = ({ label }) => {
  return (
    <View style={styles.dateSeparatorWrap}>
      <View style={styles.dateSeparatorPill}>
        <Text style={styles.dateSeparatorText}>{label}</Text>
      </View>
    </View>
  );
};

export default DateSeparator;

const styles = StyleSheet.create({
  dateSeparatorWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  dateSeparatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateSeparatorText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },
});
