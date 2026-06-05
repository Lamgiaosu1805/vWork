import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const ConfirmModal = ({ visible, action, onConfirm, onCancel, isLoading }) => {
  const isApprove = action === "approve";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.modalBox}>
          <View
            style={[
              styles.modalIconBox,
              { backgroundColor: isApprove ? "#ECFDF5" : "#FFF1F2" },
            ]}
          >
            <Ionicons
              name={isApprove ? "checkmark-circle" : "close-circle"}
              size={32}
              color={isApprove ? "#047857" : "#BE123C"}
            />
          </View>

          <Text style={styles.modalTitle}>
            {isApprove ? "Xác nhận duyệt?" : "Xác nhận từ chối?"}
          </Text>

          <Text style={styles.modalDesc}>
            {isApprove
              ? "Yêu cầu sẽ được phê duyệt và nhân viên sẽ được thông báo."
              : "Yêu cầu sẽ bị từ chối. Hành động này không thể hoàn tác."}
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.modalBtnSecondary}
            >
              <Text style={{ color: "#6B7280", fontWeight: "600" }}>Huỷ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
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
