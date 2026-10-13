import React, { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";

const defaultValue = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d;
};

/**
 * Chọn ngày + giờ hẹn. iOS: 1 picker mode "datetime" trong modal; Android: picker ngày rồi picker giờ
 * (Android không có mode "datetime").
 */
const AppointmentPickerModal = ({ visible, value, onConfirm, onClose }) => {
  const [temp, setTemp] = useState(value ?? defaultValue());
  const [androidStep, setAndroidStep] = useState("date");

  useEffect(() => {
    if (visible) {
      setTemp(value ?? defaultValue());
      setAndroidStep("date");
    }
  }, [visible, value]);

  if (Platform.OS === "android") {
    if (!visible) return null;
    return (
      <DateTimePicker
        key={androidStep}
        value={temp}
        mode={androidStep}
        is24Hour
        display="default"
        minimumDate={androidStep === "date" ? new Date() : undefined}
        onChange={(event, selected) => {
          if (event.type !== "set" || !selected) {
            onClose();
            return;
          }
          if (androidStep === "date") {
            const next = new Date(temp);
            next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
            setTemp(next);
            setAndroidStep("time");
            return;
          }
          const next = new Date(temp);
          next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
          onConfirm(next);
          onClose();
        }}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box}>
          <Text style={styles.title}>Chọn lịch hẹn</Text>
          <DateTimePicker
            style={{ width: "100%" }}
            value={temp}
            mode="datetime"
            display="spinner"
            locale="vi-VN"
            minimumDate={new Date()}
            onChange={(_event, selected) => {
              if (selected) setTemp(selected);
            }}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={() => {
                onConfirm(temp);
                onClose();
              }}
            >
              <Text style={styles.confirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AppointmentPickerModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  box: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.xl, padding: 20 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 8 },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: CRM_RADIUS.md, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  cancelText: { color: "#374151", fontWeight: "700" },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: CRM_RADIUS.md, backgroundColor: CRM_COLORS.primary, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "700" },
});
