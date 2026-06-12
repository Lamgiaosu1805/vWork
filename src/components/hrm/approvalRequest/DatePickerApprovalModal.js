import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

const DatePickerApprovalModal = ({
  visible,
  value,
  title,
  onConfirm,
  onClose,
}) => {
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  useEffect(() => {
    if (visible) {
      setDate(value ? new Date(value) : new Date());
    }
  }, [visible, value]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box}>
          <Text style={styles.title}>{title}</Text>

          <DateTimePicker
            style={{ width: "100%", alignSelf: "center" }}
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
              <Text style={styles.cancelText}>Huỷ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnConfirm}
              onPress={() => {
                onConfirm(dayjs(date).format("YYYY-MM-DD"));

                onClose();
              }}
            >
              <Text style={styles.confirmText}>Chọn</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default DatePickerApprovalModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  box: {
    width: 320,
    borderRadius: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },

  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },

  btnCancel: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cancelText: {
    color: "#6B7280",
    fontWeight: "600",
  },

  btnConfirm: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#09A896",
  },

  confirmText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
