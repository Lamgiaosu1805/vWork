import { StyleSheet, View } from "react-native";
import React from "react";
import { Skeleton, SkeletonCircle } from "../../../components/Skeleton";
import { CRM_RADIUS } from "../../crm/theme/colors";

const CustomerCallCardSkeleton = () => (
  <View style={styles.card}>
    <View style={{ flex: 1, gap: 8 }}>
      <Skeleton width="45%" height={14} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Skeleton width={90} height={12} />
        <Skeleton width={60} height={16} borderRadius={8} />
      </View>
    </View>
    <SkeletonCircle size={48} />
  </View>
);

export default CustomerCallCardSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
});
