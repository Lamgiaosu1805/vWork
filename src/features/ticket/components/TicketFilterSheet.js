import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TICKET_STATUS_CONFIG, TICKET_URGENCIES, TICKET_URGENCY_CONFIG } from "../constants";
import EmployeePicker from "./EmployeePicker";
import OptionSelect from "./OptionSelect";
import TicketDateField from "./TicketDateField";
import TicketSheet, { SheetField } from "./TicketSheet";

export const EMPTY_TICKET_FILTERS = {
  status: [],
  urgency: null,
  productId: null,
  categoryId: null,
  owner: [],
  from: null,
  to: null,
};

export const countTicketFilters = (filters) =>
  [
    filters.status.length > 0,
    Boolean(filters.urgency),
    Boolean(filters.productId),
    Boolean(filters.categoryId),
    filters.owner.length > 0,
    Boolean(filters.from || filters.to),
  ].filter(Boolean).length;

const Chip = ({ label, active, onPress, activeStyle }) => (
  <TouchableOpacity
    style={[styles.chip, active && (activeStyle ?? styles.chipActive)]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && { color: activeStyle?.color ?? "#BF360C" }]}>{label}</Text>
  </TouchableOpacity>
);

const TicketFilterSheet = ({ visible, onClose, value, onApply, meta }) => {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const set = (key, next) => setDraft((current) => ({ ...current, [key]: next }));
  const toggleStatus = (status) =>
    set(
      "status",
      draft.status.includes(status)
        ? draft.status.filter((item) => item !== status)
        : [...draft.status, status],
    );

  const activeCount = countTicketFilters(draft);

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="options-outline"
      iconColor="#374151"
      iconBg="#F3F4F6"
      title="Bộ lọc"
      subtitle={activeCount ? `Đang lọc ${activeCount} điều kiện` : "Chưa lọc điều kiện nào"}
      fullHeight
      footer={
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setDraft(EMPTY_TICKET_FILTERS)}>
            <Text style={styles.resetText}>Xoá bộ lọc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          >
            <Text style={styles.applyText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <SheetField label="Trạng thái">
        <View style={styles.chipRow}>
          {Object.entries(TICKET_STATUS_CONFIG).map(([status, cfg]) => (
            <Chip
              key={status}
              label={cfg.label}
              active={draft.status.includes(status)}
              onPress={() => toggleStatus(status)}
            />
          ))}
        </View>
      </SheetField>

      <SheetField label="Mức khẩn">
        <View style={styles.chipRow}>
          {TICKET_URGENCIES.map((urgency) => {
            const cfg = TICKET_URGENCY_CONFIG[urgency];
            return (
              <Chip
                key={urgency}
                label={cfg.label}
                active={draft.urgency === urgency}
                activeStyle={{ backgroundColor: cfg.bg, borderColor: cfg.color, color: cfg.color }}
                onPress={() => set("urgency", draft.urgency === urgency ? null : urgency)}
              />
            );
          })}
        </View>
      </SheetField>

      <SheetField label="Sản phẩm">
        <OptionSelect
          value={draft.productId}
          placeholder="Tất cả sản phẩm"
          options={(meta?.products ?? []).map((item) => ({ value: item.id, label: item.name }))}
          onChange={(next) => set("productId", next)}
        />
      </SheetField>

      <SheetField label="Loại yêu cầu">
        <OptionSelect
          value={draft.categoryId}
          placeholder="Tất cả loại"
          options={(meta?.categories ?? []).map((item) => ({ value: item.id, label: item.name }))}
          onChange={(next) => set("categoryId", next)}
        />
      </SheetField>

      <SheetField label="Người xử lý" hint="Bỏ trống: bất kỳ ai">
        <EmployeePicker
          multiple={false}
          value={draft.owner}
          onChange={(next) => set("owner", next)}
        />
      </SheetField>

      <SheetField label="Ngày tạo">
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <TicketDateField
              value={draft.from}
              placeholder="Từ ngày"
              clearable
              onChange={(next) => set("from", next)}
            />
          </View>
          <Text style={styles.dash}>–</Text>
          <View style={{ flex: 1 }}>
            <TicketDateField
              value={draft.to}
              placeholder="Đến ngày"
              clearable
              minimumDate={draft.from ?? undefined}
              onChange={(next) => set("to", next)}
            />
          </View>
        </View>
      </SheetField>
    </TicketSheet>
  );
};

export default TicketFilterSheet;

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#FFF3EE", borderColor: "#FF5722" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dash: { fontSize: 14, color: "#6B7280" },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  resetBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: { fontSize: 15, fontWeight: "700", color: "#374151" },
  applyBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FF5722",
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
