import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const KpiCard = ({ title, value, unit, note, noteColor, icon, colorIcon }) => {
  return (
    <View style={styles.kpiCard}>
      <View
        style={{
          padding: 6,
          backgroundColor: "#DCFCE7",
          borderRadius: 6,
          alignSelf: "flex-start",
          marginBottom: 6,
        }}
      >
        <Ionicons name={icon} size={22} color={colorIcon || "#2A2A2A"} />
      </View>
      <Text style={styles.kpiTitle}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
        <Text style={styles.kpiValue}>{value ?? "--"}</Text>
        {unit && <Text style={styles.kpiUnit}>{unit}</Text>}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 4,
          marginTop: 6,
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 10,
            backgroundColor: noteColor || "#9CA3AF",
          }}
        />
        <Text style={styles.kpiNote}>{note}</Text>
      </View>
    </View>
  );
};

export default KpiCard;

const styles = StyleSheet.create({
  kpiCard: {
    backgroundColor: "#CDFFF4",
    borderRadius: 16,
    padding: 12,
    width: 200,
    minHeight: 150,
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2A2A2A",
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2A2A2A",
    lineHeight: 44,
  },
  kpiUnit: { fontSize: 13, color: "#9CA3AF", marginBottom: 4 },
  kpiNote: { fontSize: 12, color: "#959595", lineHeight: 12 },
});
