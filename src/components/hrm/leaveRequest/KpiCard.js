import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../assets/theme/colors";

const KpiCard = ({ title, value, unit }) => {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <View style={{ flexDirection: "row", gap: 4, alignItems: "center", marginTop: 11 }}>
        <Text style={styles.kpiValue}>{value ?? "--"}</Text>
        {unit && <Text style={styles.kpiUnit}>{unit}</Text>}
      </View>
    </View>
  );
};

export default KpiCard;

const styles = StyleSheet.create({
  kpiCard: {
    backgroundColor: COLORS.Tertiary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 17,
    flex: 1,
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text.dark,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.dark,
  },
  kpiUnit: {
    fontSize: 12,
    color: COLORS.text.bland,
    fontWeight: "600",
  },
});
