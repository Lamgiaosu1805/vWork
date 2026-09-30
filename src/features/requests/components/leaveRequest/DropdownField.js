import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import PickerBottomSheet from "./PickerBottomSheet";

const DropdownField = ({
  label,
  value,
  onChange,
  items,
  placeholder,
  required,
}) => {
  const sheetRef = useRef(null);
  const selected = useMemo(
    () => items.find((item) => item.value === value),
    [items, value],
  );

  return (
    <View style={[styles.fieldGroup, { flex: 1 }]}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}
          {required ? "*" : ""}
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.dropdown}
        activeOpacity={0.7}
        onPress={() => sheetRef.current?.present()}
      >
        <Text
          style={
            selected ? styles.dropdownSelectedText : styles.dropdownPlaceholder
          }
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder || "Chọn..."}
        </Text>
        <Ionicons name="chevron-down" size={16} color={"#9CA3AF"} />
      </TouchableOpacity>

      <PickerBottomSheet
        ref={sheetRef}
        title={label || placeholder}
        items={items}
        value={value}
        onSelect={(v) => {
          onChange(v);
          sheetRef.current?.dismiss();
        }}
      />
    </View>
  );
};

export default DropdownField;

const styles = StyleSheet.create({
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 6,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownPlaceholder: { fontSize: 14, color: "#9CA3AF", flex: 1 },
  dropdownSelectedText: { fontSize: 14, color: "#2A2A2A", flex: 1 },
});
