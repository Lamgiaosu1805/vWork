import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const PickerTimeModal = ({ visible, value, onClose, onConfirm }) => {
  const [tempTime, setTempTime] = useState(value || new Date());

  useEffect(() => {
    if (visible) {
      setTempTime(value || new Date());
    }
  }, [visible, value]);

  if (Platform.OS === "android") {
    if (!visible) return null;

    return (
      <DateTimePicker
        value={tempTime}
        mode="time"
        is24Hour={true}
        display="default"
        onChange={(event, selected) => {
          if (event.type === "set" && selected) {
            onConfirm(selected);
          }
          onClose();
        }}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Huỷ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onConfirm(tempTime);
                onClose();
              }}
            >
              <Text style={styles.confirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>

          {/* Picker */}
          <DateTimePicker
            style={{ width: "100%" }}
            value={tempTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={(event, selected) => {
              if (selected) {
                setTempTime(selected);
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default PickerTimeModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    alignItems: "center",
  },

  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  cancelText: {
    fontSize: 16,
    color: "#EF4444",
  },

  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#39C79A",
  },
});
