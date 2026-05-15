import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const formatBirthdayDate = (isoDate) => {
  const d = new Date(isoDate);

  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(
    d.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
};

const getAge = (isoDate) => {
  const today = new Date();
  const birth = new Date(isoDate);

  return today.getFullYear() - birth.getUTCFullYear();
};

const BirthdayPanel = ({ birthdays = [], isLoading = false, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Sinh nhật tháng này</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={"#ED2E30"} />
        </View>
      ) : birthdays?.length === 0 ? (
        <Text style={styles.emptyText}>Không có sinh nhật trong tháng này</Text>
      ) : (
        birthdays?.map((item) => {
          const firstDept = item.departments?.[0];

          const dept = firstDept?.department?.department_name ?? "";

          const position = firstDept?.position?.position_name ?? "";

          const subtitle = [position, dept].filter(Boolean).join(" · ");

          return (
            <View key={item._id} style={styles.item}>
              <View style={styles.leftContent}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.full_name.charAt(0)}
                  </Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.full_name}
                  </Text>

                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.rightContent}>
                <View style={styles.dateRow}>
                  <Ionicons name="balloon" size={16} color={"#ED2E30"} />

                  <Text style={styles.dateText}>
                    {formatBirthdayDate(item.date_of_birth)}
                  </Text>
                </View>

                <Text style={styles.ageText}>
                  {getAge(item.date_of_birth)} tuổi
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

export default BirthdayPanel;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 4,
  },

  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 13,
    color: "#959595",
    marginTop: 8,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEEEE",
  },

  avatarText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ED2E30",
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#959595",
  },

  rightContent: {
    alignItems: "flex-end",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ED2E30",
  },

  ageText: {
    marginTop: 2,
    fontSize: 11,
    color: "#959595",
  },
});
