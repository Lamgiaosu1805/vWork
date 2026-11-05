import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { formatLongDate } from "../lib/ticketFormat";

// Ô chọn ngày: Android mở dialog hệ thống, iOS mở lịch ngay dưới ô (ô nằm trong bottom sheet nên không mở thêm Modal)
const TicketDateField = ({ value, onChange, placeholder = "Chọn ngày", minimumDate, clearable }) => {
  const [open, setOpen] = useState(false);

  const handlePress = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: "date",
        minimumDate,
        onChange: (event, selected) => {
          if (event.type === "set" && selected) onChange(selected);
        },
      });
      return;
    }
    setOpen((current) => !current);
  };

  return (
    <View>
      <TouchableOpacity style={styles.field} activeOpacity={0.7} onPress={handlePress}>
        <Ionicons name="calendar-outline" size={18} color="#6B7280" />
        <Text style={[styles.text, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatLongDate(value) : placeholder}
        </Text>
        {clearable && value ? (
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : (
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
        )}
      </TouchableOpacity>
      {open && Platform.OS === "ios" && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="inline"
          locale="vi-VN"
          minimumDate={minimumDate}
          accentColor="#FF5722"
          onChange={(event, selected) => {
            if (selected) onChange(selected);
            setOpen(false);
          }}
        />
      )}
    </View>
  );
};

export default TicketDateField;

const styles = StyleSheet.create({
  field: {
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: { flex: 1, fontSize: 14, color: "#111827" },
  placeholder: { color: "#9CA3AF" },
});
