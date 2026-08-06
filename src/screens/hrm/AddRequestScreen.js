import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MiniCalendar from "../../components/hrm/leaveRequest/MiniCalendar";
import DropdownField from "../../components/hrm/leaveRequest/DropdownField";
import DisplayBox from "../../components/hrm/leaveRequest/DisplayBox";
import {
  FORGOT_TYPE_ITEMS,
  PERIOD_ITEMS,
  REQUEST_TYPE_ITEMS,
  SESSION_ITEMS,
} from "../../constants/hrm";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import Header from "../../components/Header";
import useGetAllShift from "../../hooks/requests/useGetAllShift";
import useGetEligibleReviewers from "../../hooks/requests/useGetEligibleReviewers";
import useCreateRequest from "../../hooks/requests/useCreateRequest";
import PickerTimeModal from "../../components/hrm/leaveRequest/PickerTimeModal";
import { ChevronLeft } from "lucide-react-native";

const AddRequestScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState("");
  const [expectedTime, setExpectedTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [shiftId, setShiftId] = useState("");
  const [requestType, setRequestType] = useState(REQUEST_TYPE_ITEMS[0]);
  const [forgotType, setForgotType] = useState("check_in");
  const [session, setSession] = useState("full");
  const [fromPeriod, setFromPeriod] = useState("morning");
  const [toPeriod, setToPeriod] = useState("afternoon");
  const [hoverDate, setHoverDate] = useState(null);
  const [usePaidLeave, setUsePaidLeave] = useState(true);
  const [destinationLocation, setDestinationLocation] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const isLongLeave = requestType?.is_long_leave;
  const isLateOrEarly = requestType?.request_type === "late_early";
  const isLeaveRequest = requestType?.request_type === "leave" || isLongLeave;
  const isForgot = requestType?.request_type === "forgot_checkin";
  const isBusinessTrip = requestType?.request_type === "business_trip";
  const isClientVisit = requestType?.request_type === "client_visit";
  const isRemote = requestType?.request_type === "remote";
  const isRangeMode = isLongLeave || isBusinessTrip;

  const { data: shifts = [] } = useGetAllShift();
  const { data: reviewers = [], isLoading: isReviewerLoading } =
    useGetEligibleReviewers();

  const { mutate: createRequest, isPending } = useCreateRequest();

  const shiftItems = [
    { label: "-- Chọn ca làm việc --", value: "" },
    ...shifts.map((s) => ({
      label: `${s.name} (${s.start_time} - ${s.end_time})`,
      value: s._id,
    })),
  ];

  const resetForm = () => {
    setSelectedDate(null);
    setStartDate(null);
    setEndDate(null);
    setReason("");
    setMinutes("");
    setExpectedTime("");
    setShiftId("");
    setDestinationLocation("");
    setStartTime(null);
    setEndTime(null);
  };

  const handleChangeType = (v) => {
    setRequestType(v);
    setForgotType("check_in");
    setSelectedDate(null);
    setStartDate(null);
    setEndDate(null);
    setSession("full");
    setFromPeriod("morning");
    setToPeriod("afternoon");
    setMinutes("");
    setDestinationLocation("");
    setStartTime(null);
    setEndTime(null);
  };

  const handleDayPress = (date) => {
    if ((isLateOrEarly || isForgot) && !date.isSame(selectedDate, "day"))
      return Toast.show({
        type: "info",
        text1: "Không thể thay đổi ngày cho loại đơn này",
      });

    if (isRangeMode) {
      if (!startDate || (startDate && endDate)) {
        setStartDate(date);
        setEndDate(null);
      } else {
        if (date.isBefore(startDate, "day")) {
          setEndDate(startDate);
          setStartDate(date);
        } else {
          setEndDate(date);
        }
      }
    } else {
      setSelectedDate(date);
    }
    setHoverDate(null);
  };

  const handleSubmit = () => {
    if (isRangeMode && (!startDate || !endDate)) {
      Toast.show({
        type: "info",
        text1: isBusinessTrip
          ? "Vui lòng chọn khoảng thời gian công tác"
          : "Vui lòng chọn khoảng thời gian nghỉ",
      });
      return;
    }
    if (!isRangeMode && !selectedDate) {
      Toast.show({ type: "info", text1: "Vui lòng chọn ngày" });
      return;
    }
    if (isLateOrEarly && (!minutes || Number(minutes) <= 0)) {
      Toast.show({ type: "info", text1: "Số phút không hợp lệ" });
      return;
    }
    if (isLateOrEarly && !shiftId) {
      Toast.show({ type: "info", text1: "Vui lòng chọn ca làm việc" });
      return;
    }
    if (isForgot && !expectedTime) {
      Toast.show({
        type: "info",
        text1: "Vui lòng nhập giờ chấm công dự kiến",
      });
      return;
    }
    if (isBusinessTrip && !destinationLocation.trim()) {
      Toast.show({ type: "info", text1: "Vui lòng nhập địa điểm công tác" });
      return;
    }
    if (isClientVisit && (!startTime || !endTime)) {
      Toast.show({
        type: "info",
        text1: "Vui lòng nhập giờ bắt đầu và kết thúc",
      });
      return;
    }
    if (isClientVisit && startTime && endTime && !dayjs(endTime).isAfter(startTime)) {
      Toast.show({
        type: "info",
        text1: "Giờ kết thúc phải sau giờ bắt đầu",
      });
      return;
    }

    const payload = { reason: reason.trim() };

    if (isForgot) {
      payload.request_type = "forgot_checkin";
      payload.date = dayjs(selectedDate).format("YYYY-MM-DD");
      payload.type = forgotType;
      const dt = dayjs(selectedDate)
        .hour(dayjs(expectedTime).hour())
        .minute(dayjs(expectedTime).minute())
        .second(0)
        .toISOString();
      if (forgotType === "check_in") payload.expected_check_in = dt;
      else payload.expected_check_out = dt;
    }

    if (isLateOrEarly) {
      payload.request_type = "late_early";
      payload.date = dayjs(selectedDate).format("YYYY-MM-DD");
      payload.minutes = Number(minutes);
      payload.type =
        requestType?.request_type === "late_early" &&
        requestType?.type === "late"
          ? "late"
          : "early_out";
      payload.shift_id = shiftId;
    }

    if (isLeaveRequest) {
      payload.request_type = "leave";
      if (!isLongLeave) {
        payload.from_date = dayjs(selectedDate).format("YYYY-MM-DD");
        payload.to_date = dayjs(selectedDate).format("YYYY-MM-DD");
        payload.from_period = session === "afternoon" ? "afternoon" : "morning";
        payload.to_period = session === "morning" ? "morning" : "afternoon";
        payload.leave_type =
          requestType?.request_type === "leave" &&
          requestType?.leave_type === "unpaid"
            ? "unpaid"
            : "paid";
      } else {
        payload.from_date = dayjs(startDate).format("YYYY-MM-DD");
        payload.to_date = dayjs(endDate).format("YYYY-MM-DD");
        payload.from_period = fromPeriod;
        payload.to_period = toPeriod;
        payload.leave_type = usePaidLeave ? "paid" : "unpaid";
      }
    }

    if (isBusinessTrip) {
      payload.request_type = "business_trip";
      payload.from_date = dayjs(startDate).format("YYYY-MM-DD");
      payload.to_date = dayjs(endDate).format("YYYY-MM-DD");
      payload.destination_location = destinationLocation.trim();
    }

    if (isClientVisit) {
      payload.request_type = "client_visit";
      payload.visit_date = dayjs(selectedDate).format("YYYY-MM-DD");
      payload.start_time = dayjs(startTime).format("HH:mm");
      payload.end_time = dayjs(endTime).format("HH:mm");
    }

    if (isRemote) {
      payload.request_type = "remote";
      const day = dayjs(selectedDate).format("YYYY-MM-DD");
      payload.from_date = day;
      payload.to_date = day;
    }

    createRequest(payload, {
      onSuccess: () => {
        resetForm();
        Toast.show({ type: "success", text1: "Gửi yêu cầu thành công!" });
        navigation.goBack();
      },
      onError: (errorMessage) => {
        Toast.show({ type: "error", text1: errorMessage });
      },
    });
  };

  useEffect(() => {
    if (isLateOrEarly || isForgot) {
      setSelectedDate(dayjs());
    }
  }, [isLateOrEarly, isForgot]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }} edges={[]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: "#F5F7FB" }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Header
            title="Tạo Đơn Giải Trình / Nghỉ Phép"
            LeftIcon={ChevronLeft}
            onLeftPress={() => navigation.goBack()}
          />

          {/* ── FORM ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tạo Đơn Giải Trình / Nghỉ Phép</Text>
            <Text style={styles.cardSubtitle}>
              Hệ thống đánh giá chống lạm dụng, phát sinh cảnh báo cuối vì phạm
              công thời gian thực.
            </Text>

            {/* Loại đơn */}
            <DropdownField
              value={requestType.value}
              onChange={(value) => {
                const selected = REQUEST_TYPE_ITEMS.find(
                  (item) => item.value === value,
                );

                handleChangeType(selected);
              }}
              items={REQUEST_TYPE_ITEMS}
              placeholder="Chọn loại đơn"
            />
            {/* ── Date fields ── */}
            {isRangeMode ? (
              <>
                <View style={styles.row}>
                  <DisplayBox
                    label="Từ ngày"
                    value={
                      startDate ? dayjs(startDate).format("DD/MM/YYYY") : ""
                    }
                    placeholder="Chọn ngày bắt đầu"
                  />
                  {isLongLeave && (
                    <>
                      <View style={{ width: 10 }} />
                      <DropdownField
                        label="Ca bắt đầu"
                        required
                        value={fromPeriod}
                        onChange={setFromPeriod}
                        items={PERIOD_ITEMS}
                      />
                    </>
                  )}
                </View>
                <View style={styles.row}>
                  <DisplayBox
                    label="Đến ngày"
                    value={endDate ? dayjs(endDate).format("DD/MM/YYYY") : ""}
                    placeholder="Chọn ngày kết thúc"
                  />
                  {isLongLeave && (
                    <>
                      <View style={{ width: 10 }} />
                      <DropdownField
                        label="Ca kết thúc"
                        required
                        value={toPeriod}
                        onChange={setToPeriod}
                        items={PERIOD_ITEMS}
                      />
                    </>
                  )}
                </View>

                {isBusinessTrip && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Địa điểm*</Text>
                    <TextInput
                      style={styles.input}
                      value={destinationLocation}
                      onChangeText={setDestinationLocation}
                      placeholder="Nhập địa điểm công tác"
                      placeholderTextColor={"#9CA3AF"}
                    />
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <DisplayBox
                    label="Ngày diễn ra sự việc"
                    value={
                      selectedDate
                        ? dayjs(selectedDate).format("DD/MM/YYYY")
                        : ""
                    }
                    placeholder="Chọn ngày trên lịch"
                  />
                  {isLeaveRequest && !isLateOrEarly && (
                    <>
                      <View style={{ width: 10 }} />
                      <DropdownField
                        label="Buổi nghỉ"
                        required
                        value={session}
                        onChange={setSession}
                        items={SESSION_ITEMS}
                      />
                    </>
                  )}
                </View>

                {isLateOrEarly && (
                  <View style={styles.row}>
                    <DropdownField
                      label="Ca làm việc"
                      required
                      value={shiftId}
                      onChange={setShiftId}
                      items={shiftItems}
                      placeholder="-- Chọn ca làm việc --"
                    />
                    <View style={{ width: 10 }} />
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Số phút*</Text>
                      <TextInput
                        style={styles.input}
                        value={minutes}
                        onChangeText={setMinutes}
                        keyboardType="numeric"
                        placeholder="Nhập số phút"
                        placeholderTextColor={"#9CA3AF"}
                      />
                    </View>
                  </View>
                )}

                {isClientVisit && (
                  <View style={styles.row}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Giờ bắt đầu*</Text>
                      <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <Text
                          style={{
                            color: startTime ? "#2A2A2A" : "#9CA3AF",
                            fontSize: 14,
                            marginTop: 14,
                          }}
                        >
                          {startTime ? dayjs(startTime).format("HH:mm") : "--:--"}
                        </Text>
                      </TouchableOpacity>
                      <PickerTimeModal
                        visible={showStartTimePicker}
                        value={startTime || new Date()}
                        onClose={() => setShowStartTimePicker(false)}
                        onConfirm={setStartTime}
                      />
                    </View>
                    <View style={{ width: 10 }} />
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Giờ kết thúc*</Text>
                      <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <Text
                          style={{
                            color: endTime ? "#2A2A2A" : "#9CA3AF",
                            fontSize: 14,
                            marginTop: 14,
                          }}
                        >
                          {endTime ? dayjs(endTime).format("HH:mm") : "--:--"}
                        </Text>
                      </TouchableOpacity>
                      <PickerTimeModal
                        visible={showEndTimePicker}
                        value={endTime || new Date()}
                        onClose={() => setShowEndTimePicker(false)}
                        onConfirm={setEndTime}
                      />
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Quên chấm công */}
            {isForgot && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Giờ chấm công dự kiến*</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text
                      style={{
                        color: expectedTime ? "#2A2A2A" : "#9CA3AF",
                        fontSize: 14,
                        marginTop: 14,
                      }}
                    >
                      {expectedTime
                        ? dayjs(expectedTime).format("HH:mm")
                        : "--:--"}
                    </Text>
                  </TouchableOpacity>

                  <PickerTimeModal
                    visible={showTimePicker}
                    value={expectedTime || new Date()}
                    onClose={() => setShowTimePicker(false)}
                    onConfirm={setExpectedTime}
                  />
                </View>
                <DropdownField
                  label="Loại quên chấm công"
                  required
                  value={forgotType}
                  onChange={setForgotType}
                  items={FORGOT_TYPE_ITEMS}
                />
              </>
            )}

            {/* Hình thức nghỉ dài hạn */}
            {isLongLeave && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Hình thức nghỉ*</Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={styles.radioItem}
                    onPress={() => setUsePaidLeave(true)}
                  >
                    <View
                      style={[styles.radio, usePaidLeave && styles.radioActive]}
                    />
                    <Text style={styles.radioLabel}>Nghỉ có phép</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioItem}
                    onPress={() => setUsePaidLeave(false)}
                  >
                    <View
                      style={[
                        styles.radio,
                        !usePaidLeave && styles.radioActive,
                      ]}
                    />
                    <Text style={styles.radioLabel}>Nghỉ không phép</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Luồng duyệt dự kiến */}
            {reviewers.length > 0 && (
              <View style={styles.reviewerBox}>
                <Text style={styles.reviewerBoxTitle}>
                  Luồng duyệt áp dụng
                </Text>
                {reviewers.map((r, index) => (
                  <View key={r.userInfoId || r.accountId || index} style={styles.reviewerRow}>
                    <Ionicons
                      name="person-circle-outline"
                      size={16}
                      color={"#6B7280"}
                    />
                    <Text style={styles.reviewerRowText}>
                      <Text style={{ fontWeight: "700" }}>
                        Cấp {index + 1}:{" "}
                      </Text>
                      {r.full_name}
                      {r.position_name ? ` - ${r.position_name}` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Lý do */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Lý do cụ thể</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                placeholder="Nhập lý do chi tiết giải trình..."
                placeholderTextColor={"#9CA3AF"}
                textAlignVertical="top"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (isPending || isReviewerLoading) && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={isPending || isReviewerLoading}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Gửi yêu cầu duyệt</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddRequestScreen;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    margin: 12,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A2A2A",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 16,
    lineHeight: 18,
  },
  // Form
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 0 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 6,
  },

  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#2A2A2A",
    backgroundColor: "#FFFFFF",
  },
  textarea: { height: 110, paddingTop: 12, paddingBottom: 12 },
  radioRow: { flexDirection: "row", gap: 24 },
  radioItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#9CA3AF",
  },
  radioActive: { borderColor: "#39C79A", backgroundColor: "#39C79A" },
  radioLabel: { fontSize: 14, color: "#2A2A2A" },
  submitBtn: {
    backgroundColor: "#39C79A",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  reviewerBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 6,
  },
  reviewerBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 2,
  },
  reviewerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewerRowText: { fontSize: 12, color: "#6B7280", flex: 1, flexWrap: "wrap" },
});
