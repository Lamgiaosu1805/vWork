import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import dayjs from "dayjs";
import { STATUS_MAP } from "../../../constants/hrm";
import { getRequestTypeLabel, getTimeLabel } from "../../../helpers/request";

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

          <Text style={styles.reqSmall}>
            Tạo lúc {dayjs(item.createdAt).format("HH:mm • DD/MM/YYYY")} | ID:{" "}
            {item._id.slice(-6)}
          </Text>

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
                <Text style={[styles.reqDetailText, { color: "#DC2626" }]}>
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
            onPress={onCancel}
            disabled={isCancelling}
            style={styles.cancelBtn}
          >
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
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  reqTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  reqTitle: { fontSize: 15, fontWeight: "700", color: "#2A2A2A" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },
  reqMeta: { fontSize: 13, color: "#9CA3AF", marginTop: 3 },
  reqSmall: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  reqExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 6,
  },
  reqDetailText: { fontSize: 13, color: "#2A2A2A" },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: "#444" },
});
