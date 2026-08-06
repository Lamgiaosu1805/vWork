import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { STATUS_MAP } from "../../../constants/hrm";
import { getRequestTypeLabel, getTimeLabel } from "../../../helpers/request";
import { COLORS } from "../../../assets/theme/colors";

const RequestCard = ({ item, expanded, onToggle, onCancel, isCancelling }) => {
  const isLeave = item.request_type === "leave";
  const isBusinessTrip = item.request_type === "business_trip";
  const isClientVisit = item.request_type === "client_visit";
  const leaveType =
    item.leave_type === "paid" ? "Nghỉ có phép" : "Nghỉ không phép";
  const st = STATUS_MAP[item.status] || STATUS_MAP.pending;

  const typeLabel = getRequestTypeLabel(item);

  return (
    <TouchableOpacity
      onPress={onToggle}
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

          <Text style={styles.reqMeta}>{getTimeLabel(item)}</Text>

          <View style={styles.reqFooterRow}>
            <Text style={styles.reqSmall}>
              Tạo lúc {dayjs(item.createdAt).format("HH:mm • DD/MM/YYYY")} | ID:{" "}
              {item._id.slice(-6)}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={COLORS.neutral.neutral400}
            />
          </View>

          {/* Chi tiết mở rộng */}
          {expanded && (
            <View style={styles.reqExpanded}>
              {isLeave && (
                <>
                  <Text style={styles.reqDetailText}>
                    <Text style={{ fontWeight: "700" }}>Hình thức: </Text>
                    {leaveType}
                  </Text>
                  <Text style={styles.reqDetailText}>
                    <Text style={{ fontWeight: "700" }}>Tổng số ngày: </Text>
                    {item.total_days || 0} ngày
                  </Text>
                  <Text style={styles.reqDetailText}>
                    <Text style={{ fontWeight: "700" }}>Phép sử dụng: </Text>
                    {item.paid_days || 0} ngày phép • {item.unpaid_days || 0}{" "}
                    ngày không phép
                  </Text>
                </>
              )}
              {isBusinessTrip && (
                <Text style={styles.reqDetailText}>
                  <Text style={{ fontWeight: "700" }}>Địa điểm: </Text>
                  {item.destination_location || "--"}
                </Text>
              )}
              {isClientVisit && (
                <Text style={styles.reqDetailText}>
                  <Text style={{ fontWeight: "700" }}>Thời gian: </Text>
                  {item.start_time ?? "--"} - {item.end_time ?? "--"}
                </Text>
              )}
              {item.status === "rejected" && item.reviewer_note && (
                <Text style={[styles.reqDetailText, { color: COLORS.error.error600 }]}>
                  <Text style={{ fontWeight: "700" }}>Lí do từ chối: </Text>
                  {item.reviewer_note}
                </Text>
              )}
            </View>
          )}
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
  reqFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  reqSmall: { fontSize: 12, color: COLORS.neutral.neutral400 },
  reqExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral.neutral200,
    gap: 6,
  },
  reqDetailText: { fontSize: 13, color: COLORS.text.dark, lineHeight: 19 },
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
