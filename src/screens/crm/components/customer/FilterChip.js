import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { Feather } from "@expo/vector-icons";

const FilterChip = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ position: "relative", zIndex: 10 }}>
      <TouchableOpacity
        style={styles.filterChip}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.filterChipText}>{selected?.label ?? label}</Text>
        <Feather
          name="chevron-down"
          size={14}
          color="#6B7280"
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.dropdownItem,
                opt.value === value && styles.dropdownItemActive,
              ]}
              onPress={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  opt.value === value && styles.dropdownItemTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default FilterChip;

const styles = StyleSheet.create({
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    height: 36,
  },
  filterChipText: {
    fontSize: 13,
    color: "#374151",
  },
  dropdown: {
    position: "absolute",
    top: 40,
    left: 0,
    minWidth: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemActive: {
    backgroundColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#374151",
  },
  dropdownItemTextActive: {
    fontWeight: "600",
    color: "#111827",
  },
});
