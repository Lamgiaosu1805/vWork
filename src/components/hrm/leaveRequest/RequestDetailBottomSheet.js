import React, { forwardRef, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { STATUS_MAP, FORGOT_TYPE_ITEMS } from "../../../constants/hrm";
import { getRequestTypeLabel, getTimeLabel } from "../../../helpers/request";
import { COLORS } from "../../../assets/theme/colors";

const DetailRow = ({ label, value, valueColor }) => {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
};

const RequestDetailBottomSheet = forwardRef(({ item, onCancel, isCancelling }, ref) => {
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
      />
    ),
    [],
  );

  if (!item) {
    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
      />
    );
  }

  const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
  const typeLabel = getRequestTypeLabel(item);
  const timeLabel = getTimeLabel(item);

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>{typeLabel}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>
              {st.label}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <DetailRow label="Thời gian" value={timeLabel} />
          <DetailRow label="Lý do" value={item.reason || "--"} />

          {item.request_type === "leave" && (
            <>
              <DetailRow
                label="Hình thức"
                value={item.leave_type === "paid" ? "Nghỉ có phép" : "Nghỉ không phép"}
              />
              <DetailRow label="Tổng số ngày" value={`${item.total_days || 0} ngày`} />
              <DetailRow
                label="Phép sử dụng"
                value={`${item.paid_days || 0} ngày phép • ${item.unpaid_days || 0} ngày không phép`}
              />
            </>
          )}

          {item.request_type === "forgot_checkin" && (
            <>
              <DetailRow
                label="Loại"
                value={
                  FORGOT_TYPE_ITEMS.find((f) => f.value === item.type)?.label ??
                  "--"
                }
              />
              {item.expected_check_in && (
                <DetailRow
                  label="Giờ check-in dự kiến"
                  value={dayjs(item.expected_check_in).format("HH:mm")}
                />
              )}
              {item.expected_check_out && (
                <DetailRow
                  label="Giờ check-out dự kiến"
                  value={dayjs(item.expected_check_out).format("HH:mm")}
                />
              )}
            </>
          )}

          {item.request_type === "late_early" && (
            <>
              <DetailRow
                label="Loại"
                value={item.type === "late" ? "Đi muộn" : "Về sớm"}
              />
              <DetailRow label="Số phút" value={`${item.minutes || 0} phút`} />
            </>
          )}

          {item.request_type === "business_trip" && (
            <DetailRow label="Địa điểm" value={item.destination_location || "--"} />
          )}

          {item.request_type === "client_visit" && (
            <DetailRow
              label="Thời gian gặp"
              value={`${item.start_time ?? "--"} - ${item.end_time ?? "--"}`}
            />
          )}

          {item.status === "rejected" && item.reviewer_note && (
            <DetailRow
              label="Lý do từ chối"
              value={item.reviewer_note}
              valueColor={COLORS.error.error600}
            />
          )}
        </View>

        <View style={styles.section}>
          <DetailRow
            label="Tạo lúc"
            value={dayjs(item.createdAt).format("HH:mm • DD/MM/YYYY")}
          />
        </View>

        {item.status === "pending" && (
          <TouchableOpacity
            onPress={onCancel}
            disabled={isCancelling}
            style={[styles.cancelBtn, isCancelling && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            <Ionicons name="close-circle-outline" size={16} color={COLORS.white} />
            <Text style={styles.cancelBtnText}>Thu hồi đơn</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default RequestDetailBottomSheet;

const styles = StyleSheet.create({
  handleIndicator: { backgroundColor: COLORS.neutral.neutral300, width: 40 },
  list: { paddingHorizontal: 16 },
  listContent: { paddingBottom: 28 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.neutral200,
  },
  title: { flex: 1, fontSize: 17, fontWeight: "700", color: COLORS.text.dark },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "700" },
  section: {
    marginTop: 12,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.neutral200,
    gap: 10,
  },
  detailRow: { gap: 2 },
  detailLabel: { fontSize: 12, fontWeight: "600", color: COLORS.text.bland },
  detailValue: { fontSize: 14, color: COLORS.text.dark, lineHeight: 20 },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
    backgroundColor: COLORS.error.error600,
    borderRadius: 12,
    height: 48,
  },
  cancelBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});
