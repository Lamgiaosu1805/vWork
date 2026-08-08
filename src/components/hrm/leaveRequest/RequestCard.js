import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { STATUS_MAP } from "../../../constants/hrm";
import { getRequestTypeLabel, getTimeLabel } from "../../../helpers/request";
import { COLORS } from "../../../assets/theme/colors";

const RequestCard = ({ item, onPress, onCancel, isCancelling }) => {
  const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
  const typeLabel = getRequestTypeLabel(item);

  const isPending = item.status === "pending";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.requestCard, isPending && { paddingRight: 40 }]}
      activeOpacity={0.85}
    >
      {isPending && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            onCancel();
          }}
          disabled={isCancelling}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.cancelIconBtn, isCancelling && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={16} color={COLORS.error.error600} />
        </TouchableOpacity>
      )}

      {/* Title + badge */}
      <View style={styles.reqTitleRow}>
        <Text style={styles.reqTitle}>{typeLabel}</Text>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Text style={[styles.statusText, { color: st.color }]}>
            {st.label}
          </Text>
        </View>
      </View>

      <Text style={styles.reqMeta}>Lý do: {item.reason || "--"}</Text>

      <Text style={styles.reqMeta}>Thời gian: {getTimeLabel(item)}</Text>
    </TouchableOpacity>
  );
};

export default RequestCard;

const styles = StyleSheet.create({
  requestCard: {
    position: "relative",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.neutral.neutral200,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  reqTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  reqTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text.dark },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },
  reqMeta: { fontSize: 13, color: COLORS.text.bland, marginTop: 3 },
  cancelIconBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.error.error50,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
