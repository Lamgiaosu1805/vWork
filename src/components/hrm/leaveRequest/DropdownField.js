import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";

const DropdownField = ({
  label,
  value,
  onChange,
  items,
  placeholder,
  required,
}) => {
  return (
    <View style={[styles.fieldGroup, { flex: 1 }]}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}
          {required ? "*" : ""}
        </Text>
      ) : null}
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.dropdownPlaceholder}
        selectedTextStyle={styles.dropdownSelectedText}
        itemTextStyle={{ fontSize: 14, color: "#2A2A2A" }}
        activeColor="rgba(57,199,154,0.1)"
        data={items}
        maxHeight={220}
        labelField="label"
        valueField="value"
        placeholder={placeholder || "Chọn..."}
        value={value}
        onChange={(item) => onChange(item.value)}
        renderRightIcon={() => (
          <View pointerEvents="none">
            <Ionicons name="chevron-down" size={16} color={"#9CA3AF"} />
          </View>
        )}
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
  },
  dropdownPlaceholder: { fontSize: 14, color: "#9CA3AF" },
  dropdownSelectedText: { fontSize: 14, color: "#2A2A2A" },
});
