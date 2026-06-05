import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { SHIFT_LABEL, STATUS_MAP } from "../../../constants/hrm";
import dayjs from "dayjs";

const RequestCard = ({ item, expanded, onToggle, onCancel, isCancelling }) => {
  const isLeave = item.request_type === "leave";
  const fromDate = item.from_date
    ? dayjs(item.from_date).format("DD/MM/YYYY")
    : null;
  const toDate = item.to_date ? dayjs(item.to_date).format("DD/MM/YYYY") : null;
  const fromSession =
    item.from_period === "morning" ? "Buổi sáng" : "Buổi chiều";
  const toSession = item.to_period === "morning" ? "Buổi sáng" : "Buổi chiều";
  const leaveType =
    item.leave_type === "paid" ? "Nghỉ có phép" : "Nghỉ không phép";
  const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
  
  const typeLabel =
    item.request_type === "leave"
      ? "Đơn nghỉ phép"
      : item.request_type === "forgot_checkin"
        ? "Quên chấm công"
        : "Đi muộn / Về sớm";

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

          <Text style={styles.reqMeta}>
            {isLeave
              ? fromDate === toDate
                ? `${fromSession} ngày ${fromDate}`
                : `Từ ${fromSession} ${fromDate} → ${toSession} ${toDate}`
              : `${dayjs(item.date).format("DD/MM/YYYY")} • ${SHIFT_LABEL[item.shift] || "Cả ngày"}`}
          </Text>

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
              <Text style={styles.reqDetailText}>
                <Text style={{ fontWeight: "700" }}>Người duyệt: </Text>
                {item.assigned_reviewer?.full_name || "--"}
              </Text>
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
