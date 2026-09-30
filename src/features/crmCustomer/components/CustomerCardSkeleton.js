import { StyleSheet, View } from "react-native";
import React from "react";
import { Skeleton, SkeletonCircle } from "../../../components/Skeleton";
import { CRM_RADIUS } from "../../crm/theme/colors";

const CustomerCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <SkeletonCircle size={36} />
      <View style={{ flex: 1, marginLeft: 10, gap: 6 }}>
        <Skeleton width="55%" height={13} />
        <Skeleton width="35%" height={11} />
      </View>
      <Skeleton width={54} height={20} borderRadius={10} />
    </View>

    <View style={styles.tagsWrap}>
      <Skeleton width={70} height={18} borderRadius={10} />
      <Skeleton width={90} height={18} borderRadius={10} />
    </View>

    <Skeleton width="60%" height={11} style={{ marginTop: 8 }} />

    <View style={styles.divider} />

    <View style={styles.cardMeta}>
      <Skeleton width={50} height={12} />
      <Skeleton width={60} height={12} />
      <Skeleton width={70} height={12} />
    </View>
  </View>
);

export default CustomerCardSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: CRM_RADIUS.md,
    marginBottom: 10,
    padding: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  tagsWrap: { flexDirection: "row", gap: 6, marginTop: 10 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },
  cardMeta: { flexDirection: "row", gap: 16 },
});
