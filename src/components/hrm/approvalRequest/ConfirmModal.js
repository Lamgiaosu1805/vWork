import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const ConfirmModal = ({ visible, action, onConfirm, onCancel, isLoading }) => {
  const isApprove = action === "approve";
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (visible) setReason("");
  }, [visible]);

  const handleConfirm = () => {
    if (isApprove) onConfirm();
    else onConfirm(reason.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.modalBox}>
          {isApprove ? (
            <>
              <View
                style={[styles.modalIconBox, { backgroundColor: "#ECFDF5" }]}
              >
                <Ionicons name="checkmark-circle" size={32} color="#047857" />
              </View>
              <Text style={styles.modalTitle}>Xác nhận duyệt?</Text>
              <Text style={styles.modalDesc}>
                Yêu cầu sẽ được phê duyệt và nhân viên sẽ được thông báo.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.modalTitle, { marginBottom: 12 }]}>
                Xác nhận từ chối?
              </Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Nhập lí do từ chối cụ thể..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.modalBtnSecondary}
            >
              <Text style={{ color: "#6B7280", fontWeight: "600" }}>Huỷ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoading}
              style={[
                styles.modalBtnPrimary,
                { backgroundColor: isApprove ? "#047857" : "#BE123C" },
                isLoading && { opacity: 0.6 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {isApprove ? "Duyệt" : "Từ chối"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default ConfirmModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: 300,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  reasonInput: {
    width: "100%",
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    fontSize: 13,
    color: "#111827",
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
