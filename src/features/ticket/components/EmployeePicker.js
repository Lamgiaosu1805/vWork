import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useTicketEmployees from "../hooks/useTicketEmployees";
import { Avatar } from "./TicketBadges";
import { sheetInputStyle } from "./TicketSheet";

// Chọn nhân viên (một hoặc nhiều): chip người đã chọn + ô tìm + danh sách kết quả. `assignable` chỉ trả những
// người mình được phép giao việc (backend lọc theo quyền giao).
const EmployeePicker = ({
  value = [],
  onChange,
  multiple = true,
  assignable = false,
  excludeIds = [],
  placeholder = "Gõ tên hoặc mã nhân viên",
}) => {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const { employees, isFetching } = useTicketEmployees(debounced.trim(), { assignable });

  const selectedIds = new Set(value.map((item) => item.id));
  const hidden = new Set(excludeIds);
  const results = employees.filter((item) => !hidden.has(item.id)).slice(0, 8);

  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(text), 350);
  };

  const toggle = (employee) => {
    const entry = { id: employee.id, name: employee.fullName ?? employee.name };
    if (!multiple) {
      onChange(selectedIds.has(employee.id) ? [] : [entry]);
      return;
    }
    onChange(
      selectedIds.has(employee.id)
        ? value.filter((item) => item.id !== employee.id)
        : [...value, entry],
    );
  };

  return (
    <View style={styles.container}>
      {value.length > 0 && (
        <View style={styles.chips}>
          {value.map((item) => (
            <View key={item.id} style={styles.chip}>
              <Avatar id={item.id} name={item.name} size={22} />
              <Text style={styles.chipText} numberOfLines={1}>
                {item.name}
              </Text>
              <TouchableOpacity
                hitSlop={8}
                onPress={() => onChange(value.filter((selected) => selected.id !== item.id))}
              >
                <Ionicons name="close" size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={[sheetInputStyle, styles.searchBox]}>
        <Ionicons name="search-outline" size={18} color="#6B7280" />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
        {isFetching && <ActivityIndicator size="small" color="#9CA3AF" />}
      </View>

      <View style={styles.list}>
        {results.length === 0 && !isFetching ? (
          <Text style={styles.empty}>Không tìm thấy nhân viên</Text>
        ) : (
          results.map((employee, index) => {
            const checked = selectedIds.has(employee.id);
            return (
              <TouchableOpacity
                key={employee.id}
                style={[styles.row, index > 0 && styles.rowBorder]}
                onPress={() => toggle(employee)}
              >
                <Avatar id={employee.id} name={employee.fullName} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {employee.fullName}
                  </Text>
                  {!!employee.departmentNames?.length && (
                    <Text style={styles.dept} numberOfLines={1}>
                      {employee.departmentNames.join(", ")}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={checked ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={checked ? "#FF5722" : "#D1D5DB"}
                />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
};

export default EmployeePicker;

const styles = StyleSheet.create({
  container: { gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFF3EE",
    maxWidth: "100%",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#BF360C", flexShrink: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 0 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", height: 44 },
  list: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: "#F0F1F3" },
  name: { fontSize: 14, fontWeight: "600", color: "#1A1D26" },
  dept: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  empty: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingVertical: 14 },
});
