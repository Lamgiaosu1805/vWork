import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import dayjs from "dayjs";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { CalendarClock, PhoneCall } from "lucide-react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import useCreateCareReport from "../hooks/useCreateCareReport";
import AppointmentPickerModal from "./AppointmentPickerModal";
import {
  CONTACT_RESULT_OPTIONS,
  INTERACTION_TYPE_OPTIONS,
  LOST_REASON_OPTIONS,
  RESULT_OPTIONS,
} from "../lib/labels";
import { customerNameOf } from "../lib/sla";

const CONTENT_MAX = 2000;

const EMPTY_FORM = {
  type: "call",
  contact_result: null,
  customer_need: "",
  result: null,
  next_step: "",
  appointment_at: null,
  lost_reason: null,
  content: "",
};

// Tên field trong missing_fields của API (400) → key form, để tô đỏ đúng ô
const API_MISSING_TO_FIELD = {
  "kết quả liên hệ": "contact_result",
  "nhu cầu khách hàng": "customer_need",
  "trạng thái hiện tại": "result",
  "lý do khách từ chối": "lost_reason",
  "bước tiếp theo": "next_step",
};

/**
 * Cùng quy tắc với POST /customer/interactions/:externalId: khách đang giao cho chính Sale (strict) bắt
 * buộc kết quả liên hệ, nhu cầu, trạng thái hiện tại, bước tiếp theo (Không quan tâm → lý do từ chối
 * thay cho bước tiếp theo). Ngoài hàng đợi: cần ít nhất nhu cầu hoặc ghi chú.
 */
export const validateCareReport = (form, strict) => {
  const missing = [];
  if (strict) {
    if (!form.contact_result) missing.push({ field: "contact_result", label: "kết quả liên hệ" });
    if (!form.customer_need.trim()) missing.push({ field: "customer_need", label: "nhu cầu khách hàng" });
    if (!form.result) missing.push({ field: "result", label: "trạng thái hiện tại" });
    if (form.result === "not_interested") {
      if (!form.lost_reason) missing.push({ field: "lost_reason", label: "lý do khách từ chối" });
    } else if (!form.next_step.trim()) {
      missing.push({ field: "next_step", label: "bước tiếp theo" });
    }
  } else if (!form.customer_need.trim() && !form.content.trim()) {
    missing.push({ field: "customer_need", label: "nhu cầu khách hàng hoặc ghi chú" });
  }
  return missing;
};

const buildBody = (form, callLogId) => {
  const body = {
    type: form.type,
    contact_result: form.contact_result,
    customer_need: form.customer_need.trim() || null,
    result: form.result,
    next_action: {
      description: form.next_step.trim() || null,
      due_date: form.appointment_at ? form.appointment_at.toISOString() : null,
    },
    lost_reason: form.result === "not_interested" ? form.lost_reason : null,
    content: form.content.trim() || null,
  };
  if (callLogId) body.call_log_id = callLogId;
  return body;
};

const ChipGroup = ({ options, value, onChange, error }) => (
  <View style={[styles.chipWrap, error && styles.groupError]}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.chip, active && styles.chipActive]}
          activeOpacity={0.8}
          onPress={() => onChange(active ? null : opt.value)}
        >
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const FieldLabel = ({ text, required }) => (
  <Text style={styles.label}>
    {text}
    {required ? <Text style={styles.required}> *</Text> : <Text style={styles.optional}> (không bắt buộc)</Text>}
  </Text>
);

/**
 * target: { customer, callLogId, strict } | null — set target để mở sheet.
 * onClose(submitted: boolean)
 */
const CareReportSheet = ({ target, onClose }) => {
  const sheetRef = useRef(null);
  const submittedRef = useRef(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [missingText, setMissingText] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const createMutation = useCreateCareReport();

  const customerKey = target?.customer?._id ?? target?.customer?.external_id ?? null;

  useEffect(() => {
    if (!customerKey) return;
    submittedRef.current = false;
    setForm(EMPTY_FORM);
    setErrors({});
    setMissingText(null);
    sheetRef.current?.present();
  }, [customerKey]);

  const strict = !!target?.strict;

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />,
    [],
  );

  const showMissing = (items) => {
    setErrors(Object.fromEntries(items.map((m) => [m.field, true])));
    setMissingText(`Vui lòng nhập đủ: ${items.map((m) => m.label).join(", ")}`);
  };

  const handleSubmit = () => {
    if (!target?.customer?.external_id) {
      Toast.show({ type: "error", text1: "Thiếu mã khách hàng, không thể lưu báo cáo" });
      return;
    }
    const missing = validateCareReport(form, strict);
    if (missing.length) {
      showMissing(missing);
      return;
    }
    if (form.content.trim().length > CONTENT_MAX) {
      setErrors({ content: true });
      setMissingText("Ghi chú tối đa 2.000 ký tự");
      return;
    }
    if (form.appointment_at && form.appointment_at.getTime() <= Date.now()) {
      setErrors({ appointment_at: true });
      setMissingText("Lịch hẹn phải ở thời điểm trong tương lai");
      return;
    }
    setMissingText(null);

    createMutation.mutate(
      {
        externalId: target.customer.external_id,
        customerId: target.customer._id,
        body: buildBody(form, target.callLogId),
      },
      {
        onSuccess: () => {
          submittedRef.current = true;
          Toast.show({ type: "success", text1: "Đã lưu báo cáo chăm sóc" });
          sheetRef.current?.dismiss();
        },
        onError: (err) => {
          const data = err?.response?.data;
          if (err?.response?.status === 400 && Array.isArray(data?.missing_fields)) {
            showMissing(
              data.missing_fields.map((label) => ({ field: API_MISSING_TO_FIELD[label] ?? label, label })),
            );
          } else {
            setMissingText(data?.message || null);
          }
          Toast.show({
            type: "error",
            text1: "Không thể lưu báo cáo",
            text2: data?.message || err?.message || "Lỗi không xác định",
          });
        },
      },
    );
  };

  const renderFooter = useCallback(
    (props) => (
      <BottomSheetFooter {...props} style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, createMutation.isPending && styles.saveBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Lưu báo cáo</Text>
          )}
        </TouchableOpacity>
      </BottomSheetFooter>
    ),
    // handleSubmit đọc form/target mới nhất qua closure — cần render lại footer khi chúng đổi
    [createMutation.isPending, form, target, strict],
  );

  const notInterested = form.result === "not_interested";
  const customer = target?.customer;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["92%"]}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      onDismiss={() => onClose?.(submittedRef.current)}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {!customer ? null : (
        <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Báo cáo chăm sóc</Text>
              <Text style={styles.customerName} numberOfLines={1}>
                {customerNameOf(customer)}
              </Text>
              {!!customer.phone_number && <Text style={styles.customerPhone}>{customer.phone_number}</Text>}
            </View>
            <TouchableOpacity onPress={() => sheetRef.current?.dismiss()} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {!!target.callLogId && (
            <View style={styles.callTag}>
              <PhoneCall size={14} color={CRM_COLORS.accent} />
              <Text style={styles.callTagText}>Gắn với cuộc gọi tổng đài vừa kết thúc</Text>
            </View>
          )}
          {strict && (
            <Text style={styles.hint}>
              Báo cáo đủ các mục bắt buộc được tính là hoạt động chăm sóc hợp lệ (giữ khách, không bị thu hồi).
            </Text>
          )}

          {!!missingText && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={styles.errorBannerText}>{missingText}</Text>
            </View>
          )}

          <FieldLabel text="Hình thức" required />
          <ChipGroup options={INTERACTION_TYPE_OPTIONS} value={form.type} onChange={(v) => update("type", v ?? "call")} />

          <FieldLabel text="Kết quả liên hệ" required={strict} />
          <ChipGroup
            options={CONTACT_RESULT_OPTIONS}
            value={form.contact_result}
            onChange={(v) => update("contact_result", v)}
            error={errors.contact_result}
          />

          <FieldLabel text="Nhu cầu khách hàng" required={strict} />
          <BottomSheetTextInput
            style={[styles.input, errors.customer_need && styles.inputError]}
            value={form.customer_need}
            onChangeText={(v) => update("customer_need", v)}
            placeholder="Khách quan tâm sản phẩm gì, số tiền, kỳ hạn..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />

          <FieldLabel text="Trạng thái hiện tại" required={strict} />
          <ChipGroup
            options={RESULT_OPTIONS}
            value={form.result}
            onChange={(v) => update("result", v)}
            error={errors.result}
          />

          {notInterested && (
            <>
              <FieldLabel text="Lý do khách từ chối" required={strict} />
              <ChipGroup
                options={LOST_REASON_OPTIONS}
                value={form.lost_reason}
                onChange={(v) => update("lost_reason", v)}
                error={errors.lost_reason}
              />
            </>
          )}

          <FieldLabel text="Bước tiếp theo" required={strict && !notInterested} />
          <BottomSheetTextInput
            style={[styles.input, styles.inputSingle, errors.next_step && styles.inputError]}
            value={form.next_step}
            onChangeText={(v) => update("next_step", v)}
            placeholder="VD: Gửi thông tin sản phẩm, gọi lại tư vấn..."
            placeholderTextColor="#9CA3AF"
          />

          <FieldLabel text="Lịch hẹn" />
          <View style={styles.appointmentRow}>
            <TouchableOpacity
              style={[styles.appointmentBtn, errors.appointment_at && styles.inputError]}
              activeOpacity={0.8}
              onPress={() => setPickerVisible(true)}
            >
              <CalendarClock size={16} color={CRM_COLORS.accent} />
              <Text style={styles.appointmentText}>
                {form.appointment_at ? dayjs(form.appointment_at).format("HH:mm, DD/MM/YYYY") : "Chọn ngày giờ hẹn"}
              </Text>
            </TouchableOpacity>
            {!!form.appointment_at && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => update("appointment_at", null)}>
                <Ionicons name="close-circle" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          {!!form.appointment_at && (
            <Text style={styles.hintSmall}>Lịch hẹn còn hiệu lực giúp khách không bị thu hồi do chưa chăm sóc.</Text>
          )}

          <FieldLabel text="Ghi chú" />
          <BottomSheetTextInput
            style={[styles.input, errors.content && styles.inputError]}
            value={form.content}
            onChangeText={(v) => update("content", v)}
            placeholder="Ghi chú thêm..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={CONTENT_MAX}
            textAlignVertical="top"
          />

          <View style={{ height: 110 }} />
        </BottomSheetScrollView>
      )}

      <AppointmentPickerModal
        visible={pickerVisible}
        value={form.appointment_at}
        onConfirm={(date) => update("appointment_at", date)}
        onClose={() => setPickerVisible(false)}
      />
    </BottomSheetModal>
  );
};

export default CareReportSheet;

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: "#fff", borderTopLeftRadius: CRM_RADIUS.xl, borderTopRightRadius: CRM_RADIUS.xl },
  handle: { backgroundColor: "#D1D5DB" },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  header: { flexDirection: "row", alignItems: "flex-start", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingBottom: 14, marginBottom: 12 },
  title: { fontSize: 12, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.3 },
  customerName: { fontSize: 17, fontWeight: "800", color: "#111827", marginTop: 2 },
  customerPhone: { fontSize: 13, fontWeight: "600", color: "#4B5563", marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  callTag: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(0,82,255,0.08)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: CRM_RADIUS.pill, marginBottom: 8 },
  callTagText: { fontSize: 11, fontWeight: "700", color: CRM_COLORS.accent },
  hint: { fontSize: 12, color: "#6B7280", lineHeight: 17, marginBottom: 6 },
  hintSmall: { fontSize: 11, color: "#6B7280", marginTop: 6 },
  errorBanner: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: CRM_RADIUS.sm, padding: 10, marginTop: 6 },
  errorBannerText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#B91C1C", lineHeight: 17 },
  label: { fontSize: 12, fontWeight: "700", color: "#374151", marginTop: 16, marginBottom: 8 },
  required: { color: CRM_COLORS.error },
  optional: { color: "#9CA3AF", fontWeight: "500" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, borderRadius: CRM_RADIUS.sm, borderWidth: 1, borderColor: "transparent" },
  groupError: { borderColor: "#FCA5A5", padding: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: CRM_RADIUS.pill, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },
  chipActive: { backgroundColor: "#FFF3EE", borderColor: CRM_COLORS.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  chipTextActive: { color: CRM_COLORS.primary, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: CRM_RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: "#374151", backgroundColor: "#F9FAFB", minHeight: 80 },
  inputSingle: { minHeight: 0 },
  inputError: { borderColor: "#F87171", backgroundColor: "#FEF2F2" },
  appointmentRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  appointmentBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: CRM_RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#F9FAFB" },
  appointmentText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  clearBtn: { padding: 4 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, borderTopColor: "#E5E7EB", backgroundColor: "#fff" },
  saveBtn: { backgroundColor: CRM_COLORS.primary, borderRadius: CRM_RADIUS.md, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
