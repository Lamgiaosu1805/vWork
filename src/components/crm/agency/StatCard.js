import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const StatCard = ({ label, value, iconName, iconBgColor, color }) => (
  <View style={styles.statCard}>
    <View style={styles.statValueContainer}>
      <Text style={styles.statLabel}>{label}</Text>

      <View style={[styles.iconBackground, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName} size={20} color={color} />
      </View>
    </View>

    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default StatCard;

const styles = StyleSheet.create({
  statCard: {
    width: "49%",
    height: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#959595",
    lineHeight: 18,
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000000",
    lineHeight: 30,
  },
  iconBackground: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
});
