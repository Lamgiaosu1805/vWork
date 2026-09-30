import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetBackdrop, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import { useBranches } from "../../hrmBranch";
import useCrmSalesUsers from "../hooks/useCrmSalesUsers";
import RangeDatePickerModal from "./customerDetail/RangeDatePickerModal";

const FUNNEL_OPTIONS = [
  { value: "not_kyc", label: "Chưa eKYC" },
  { value: "kyc_verified", label: "Đã eKYC" },
  { value: "kyc_verified_no_investment", label: "Đã eKYC, chưa đầu tư" },
  { value: "active_investor", label: "Đang đầu tư" },
  { value: "settled", label: "Đã tất toán" },
];

const BEHAVIOR_OPTIONS = [
  { value: "upsale", label: "Up-sale" },
  { value: "cross_sale", label: "Cross-sale" },
];

const ROLE_OPTIONS = [
  { value: "collaborator", label: "CTV" },
  { value: "agent", label: "Đại lý" },
];

const ASSIGNED_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "true", label: "Đã phân công" },
  { value: "false", label: "Chưa phân công" },
];

const EMPTY_ALL_FILTERS = {
  funnel_status: [],
  behavior: [],
  role_type: [],
  assigned: "",
  branch_id: "",
  sale_ids: [],
  from_date: null,
  to_date: null,
};

const SectionTitle = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.8}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const toggleInArray = (arr, value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

const CustomerFilterSheet = forwardRef(({ value, onApply }, ref) => {
  const [draft, setDraft] = useState(value);
  const [salesSearch, setSalesSearch] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const { data: branches = [] } = useBranches();
  const { data: salesUsers = [] } = useCrmSalesUsers({ search: salesSearch, limit: 30, page: 1 });

  const handleReset = () => {
    setDraft(EMPTY_ALL_FILTERS);
  };

  const handleApply = () => {
    onApply(draft);
    ref?.current?.dismiss?.();
  };

  const fromDateObj = draft.from_date ? dayjs(draft.from_date) : null;
  const toDateObj = draft.to_date ? dayjs(draft.to_date) : null;

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />,
    [],
  );

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
      snapPoints={["85%"]}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Bộ lọc</Text>

        <View style={styles.section}>
          <SectionTitle>Phễu trạng thái</SectionTitle>
          <View style={styles.chipsRow}>
            {FUNNEL_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={draft.funnel_status.includes(opt.value)}
                onPress={() => setDraft((d) => ({ ...d, funnel_status: toggleInArray(d.funnel_status, opt.value) }))}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Hành vi</SectionTitle>
          <View style={styles.chipsRow}>
            {BEHAVIOR_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={draft.behavior.includes(opt.value)}
                onPress={() => setDraft((d) => ({ ...d, behavior: toggleInArray(d.behavior, opt.value) }))}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Vai trò</SectionTitle>
          <View style={styles.chipsRow}>
            {ROLE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={draft.role_type.includes(opt.value)}
                onPress={() => setDraft((d) => ({ ...d, role_type: toggleInArray(d.role_type, opt.value) }))}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Phân công</SectionTitle>
          <View style={styles.chipsRow}>
            {ASSIGNED_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} active={draft.assigned === opt.value} onPress={() => setDraft((d) => ({ ...d, assigned: opt.value }))} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Chi nhánh</SectionTitle>
          <View style={styles.chipsRow}>
            <Chip label="Tất cả chi nhánh" active={!draft.branch_id} onPress={() => setDraft((d) => ({ ...d, branch_id: "" }))} />
            {branches.map((b) => (
              <Chip key={b._id} label={b.branch_name} active={draft.branch_id === b._id} onPress={() => setDraft((d) => ({ ...d, branch_id: b._id }))} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Sale phụ trách</SectionTitle>
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên, mã NV..."
            placeholderTextColor="#9CA3AF"
            value={salesSearch}
            onChangeText={setSalesSearch}
          />
          <View style={styles.chipsRow}>
            {salesUsers.map((u) => (
              <Chip
                key={u._id}
                label={u.full_name || u.username}
                active={draft.sale_ids.includes(u._id)}
                onPress={() => setDraft((d) => ({ ...d, sale_ids: toggleInArray(d.sale_ids, u._id) }))}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Khoảng ngày</SectionTitle>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={16} color={CRM_COLORS.primary} />
            <Text style={styles.dateBtnText}>
              {draft.from_date || draft.to_date
                ? `${fromDateObj ? fromDateObj.format("DD/MM/YYYY") : "..."} → ${toDateObj ? toDateObj.format("DD/MM/YYYY") : "..."}`
                : "Tất cả ngày"}
            </Text>
            {(draft.from_date || draft.to_date) && (
              <TouchableOpacity onPress={() => setDraft((d) => ({ ...d, from_date: null, to_date: null }))} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
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

CustomerFilterSheet.ALL_DEFAULT = EMPTY_ALL_FILTERS;

export default CustomerFilterSheet;

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
  searchInput: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: CRM_RADIUS.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: "#111827", marginBottom: 10 },
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
