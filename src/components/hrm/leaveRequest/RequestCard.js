import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { STATUS_MAP } from "../../../constants/hrm";
import { getRequestTypeLabel, getTimeLabel } from "../../../helpers/request";
import { COLORS } from "../../../assets/theme/colors";

const RequestCard = ({ item, onPress, onCancel, isCancelling }) => {
  const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
  const typeLabel = getRequestTypeLabel(item);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.requestCard}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
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

          <Text style={[styles.reqMeta, styles.reqTime]}>
            {getTimeLabel(item)}
          </Text>
        </View>

        {/* Thu hồi */}
        {item.status === "pending" && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onCancel();
            }}
            disabled={isCancelling}
            style={[styles.cancelBtn, isCancelling && { opacity: 0.6 }]}
          >
            <Ionicons name="close-circle-outline" size={14} color={COLORS.error.error600} />
            <Text style={styles.cancelBtnText}>Thu hồi</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default RequestCard;

const styles = StyleSheet.create({
  requestCard: {
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
  reqTime: { textAlign: "center" },
  reqFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  reqSmall: { fontSize: 12, color: COLORS.neutral.neutral400 },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: COLORS.error.error50,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.error.error600 },
});
