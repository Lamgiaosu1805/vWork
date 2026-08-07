import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../assets/theme/colors";

const KpiCard = ({ icon, colorIcon = COLORS.Primary, title, value, unit }) => {
  return (
    <View style={styles.kpiCard}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: `${colorIcon}1A` }]}>
          <Ionicons name={icon} size={16} color={colorIcon} />
        </View>
      )}

      <Text style={styles.kpiTitle} numberOfLines={2}>
        {title}
      </Text>

      <View style={styles.valueRow}>
        <Text style={styles.kpiValue} numberOfLines={1}>
          {value ?? "--"}
        </Text>
        {unit && <Text style={styles.kpiUnit}>{unit}</Text>}
      </View>
    </View>
  );
};

export default KpiCard;

const styles = StyleSheet.create({
  kpiCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.neutral.neutral200,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text.dark,
    minHeight: 28,
  },
  valueRow: {
    flexDirection: "row",
    gap: 3,
    alignItems: "flex-end",
    marginTop: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text.dark,
    lineHeight: 21,
    flexShrink: 1,
  },
  kpiUnit: {
    fontSize: 11,
    color: COLORS.text.bland,
    fontWeight: "600",
    marginBottom: 1,
  },
});
