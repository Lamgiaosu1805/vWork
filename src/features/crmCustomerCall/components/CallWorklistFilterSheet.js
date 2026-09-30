import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";

const STATUS_OPTIONS = [
  { value: "chua_ekyc", label: "Chưa eKYC" },
  { value: "ekyc_chua_dt", label: "eKYC chưa ĐT" },
  { value: "dang_dau_tu", label: "Đang đầu tư" },
  { value: "da_tat_toan", label: "Đã tất toán" },
  { value: "khac", label: "Khác" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "not_friended", label: "Chưa kết bạn" },
  { value: "friended", label: "Đã kết bạn" },
  { value: "friended_no_response", label: "Kết bạn nhưng chưa phản hồi" },
];

const CALL_COUNT_OPTIONS = [
  { value: 0, label: "Chưa gọi" },
  { value: 1, label: "1 lần" },
  { value: 2, label: "2 lần" },
  { value: 3, label: "3 lần" },
  { value: "gt3", label: "Lớn hơn 3 lần" },
];

export const CALL_WORKLIST_DEFAULT_FILTERS = { status: [], relationshipStatus: [], callCount: [] };

const SectionTitle = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.8}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const toggleInArray = (arr, value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

const FilterGroup = ({ title, options, selected, onChange }) => (
  <View style={styles.section}>
    <SectionTitle>{title}</SectionTitle>
    <View style={styles.chipsRow}>
      {options.map((opt) => (
        <Chip
          key={String(opt.value)}
          label={opt.label}
          active={selected.includes(opt.value)}
          onPress={() => onChange(toggleInArray(selected, opt.value))}
        />
      ))}
    </View>
  </View>
);

const CallWorklistFilterSheet = forwardRef(({ value, onApply }, ref) => {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />,
    [],
  );

  const handleReset = () => setDraft(CALL_WORKLIST_DEFAULT_FILTERS);
  const handleApply = () => {
    onApply(draft);
    ref?.current?.dismiss?.();
  };

  const renderFooter = useCallback(
    (props) => (
      <BottomSheetFooter {...props} style={styles.footer}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
          <Text style={styles.resetText}>Mặc định</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Text style={styles.applyText}>Áp dụng bộ lọc</Text>
        </TouchableOpacity>
      </BottomSheetFooter>
    ),
    [draft],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["80%"]}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Bộ lọc khách hàng</Text>

        <FilterGroup
          title="Trạng thái eKYC"
          options={STATUS_OPTIONS}
          selected={draft.status}
          onChange={(status) => setDraft((d) => ({ ...d, status }))}
        />
        <FilterGroup
          title="Tình trạng chăm sóc"
          options={RELATIONSHIP_OPTIONS}
          selected={draft.relationshipStatus}
          onChange={(relationshipStatus) => setDraft((d) => ({ ...d, relationshipStatus }))}
        />
        <FilterGroup
          title="Số lần gọi"
          options={CALL_COUNT_OPTIONS}
          selected={draft.callCount}
          onChange={(callCount) => setDraft((d) => ({ ...d, callCount }))}
        />

        <View style={{ height: 90 }} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default CallWorklistFilterSheet;

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: CRM_COLORS.background, borderTopLeftRadius: CRM_RADIUS.xl, borderTopRightRadius: CRM_RADIUS.xl },
  handle: { backgroundColor: "#D1D5DB" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 18, fontWeight: "800", color: CRM_COLORS.textDark, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: CRM_COLORS.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: CRM_RADIUS.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: CRM_COLORS.accent, borderColor: CRM_COLORS.accent },
  chipText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  chipTextActive: { color: "#fff" },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: CRM_COLORS.white,
  },
  resetBtn: { flex: 1, paddingVertical: 13, alignItems: "center", borderRadius: CRM_RADIUS.pill, borderWidth: 1.5, borderColor: "#E5E7EB" },
  resetText: { color: "#374151", fontWeight: "700", fontSize: 14 },
  applyBtn: { flex: 2, paddingVertical: 13, alignItems: "center", borderRadius: CRM_RADIUS.pill, backgroundColor: CRM_COLORS.primary },
  applyText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
