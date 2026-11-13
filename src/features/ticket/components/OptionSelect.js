import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Ô chọn 1 giá trị dạng xổ xuống ngay trong form (form nằm trong bottom sheet nên không mở thêm Modal).
// options: [{ value, label, sublabel?, indent? }]
const OptionSelect = ({ value, options, onChange, placeholder, allowClear = true, renderLabel }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      <TouchableOpacity style={styles.field} activeOpacity={0.7} onPress={() => setOpen((v) => !v)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.text, !selected && styles.placeholder]} numberOfLines={1}>
            {selected ? (renderLabel?.(selected) ?? selected.label) : placeholder}
          </Text>
          {!!selected?.sublabel && (
            <Text style={styles.sublabel} numberOfLines={1}>
              {selected.sublabel}
            </Text>
          )}
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
      </TouchableOpacity>

      {open && (
        <View style={styles.list}>
          {allowClear && (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <Text style={[styles.rowText, styles.placeholder]}>{placeholder}</Text>
            </TouchableOpacity>
          )}
          {options.map((option) => {
            const active = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.row, option.indent && styles.rowIndent, active && styles.rowActive]}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.rowText,
                    option.indent && styles.rowTextIndent,
                    option.header && styles.rowHeader,
                    active && styles.rowTextActive,
                  ]}
                  numberOfLines={2}
                >
                  {option.label}
                </Text>
                {active && <Ionicons name="checkmark" size={18} color="#FF5722" />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default OptionSelect;

const styles = StyleSheet.create({
  field: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: { fontSize: 14, color: "#111827", fontWeight: "500" },
  sublabel: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  placeholder: { color: "#9CA3AF", fontWeight: "400" },
  list: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  rowIndent: { paddingLeft: 28 },
  rowActive: { backgroundColor: "#FFF3EE" },
  rowText: { flex: 1, fontSize: 14, color: "#1A1D26" },
  rowTextIndent: { fontSize: 13.5, color: "#4B5563" },
  rowHeader: { fontWeight: "700" },
  rowTextActive: { color: "#BF360C", fontWeight: "600" },
});
