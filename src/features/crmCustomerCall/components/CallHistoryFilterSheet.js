import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import RangeDatePickerModal from "../../crmCustomer/components/customerDetail/RangeDatePickerModal";

const DIRECTION_OPTIONS = [
  { value: "outbound", label: "Gọi đi" },
  { value: "inbound", label: "Gọi đến" },
];

export const CALL_HISTORY_DEFAULT_FILTERS = { direction: [], from_date: null, to_date: null };

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.8}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const toggleInArray = (arr, value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

const CallHistoryFilterSheet = forwardRef(({ value, onApply }, ref) => {
  const [draft, setDraft] = useState(value);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />,
    [],
  );

  const handleReset = () => setDraft(CALL_HISTORY_DEFAULT_FILTERS);
  const handleApply = () => {
    onApply(draft);
    ref?.current?.dismiss?.();
  };

  const fromDateObj = draft.from_date ? dayjs(draft.from_date) : null;
  const toDateObj = draft.to_date ? dayjs(draft.to_date) : null;

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
      snapPoints={["55%"]}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Lọc lịch sử gọi</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={16} color={CRM_COLORS.primary} />
            <Text style={styles.dateBtnText}>
              {draft.from_date || draft.to_date
                ? `${fromDateObj ? fromDateObj.format("DD/MM/YYYY") : "..."} → ${toDateObj ? toDateObj.format("DD/MM/YYYY") : "..."}`
                : "Tất cả thời gian"}
            </Text>
            {(draft.from_date || draft.to_date) && (
              <TouchableOpacity onPress={() => setDraft((d) => ({ ...d, from_date: null, to_date: null }))} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hướng gọi</Text>
          <View style={styles.chipsRow}>
            <Chip label="Tất cả hướng gọi" active={draft.direction.length === 0} onPress={() => setDraft((d) => ({ ...d, direction: [] }))} />
            {DIRECTION_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={draft.direction.includes(opt.value)}
                onPress={() => setDraft((d) => ({ ...d, direction: toggleInArray(d.direction, opt.value) }))}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 90 }} />
      </BottomSheetScrollView>

      <RangeDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(from, to) =>
          setDraft((d) => ({
            ...d,
            from_date: from ? from.startOf("day").toISOString() : null,
            to_date: to ? to.endOf("day").toISOString() : null,
          }))
        }
        initialFrom={fromDateObj}
        initialTo={toDateObj}
      />
    </BottomSheetModal>
  );
});

export default CallHistoryFilterSheet;

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
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: CRM_RADIUS.sm, paddingHorizontal: 12, paddingVertical: 12 },
  dateBtnText: { flex: 1, fontSize: 13, color: "#111827", fontWeight: "500" },
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
