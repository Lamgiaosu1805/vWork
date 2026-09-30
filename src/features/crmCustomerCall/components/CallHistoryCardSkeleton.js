import { StyleSheet, View } from "react-native";
import React from "react";
import { Skeleton } from "../../../components/Skeleton";
import { CRM_RADIUS } from "../../crm/theme/colors";

const CallHistoryCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <Skeleton width={90} height={11} />
      <Skeleton width={70} height={16} borderRadius={8} />
    </View>
    <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
    <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
  </View>
);

export default CallHistoryCardSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
