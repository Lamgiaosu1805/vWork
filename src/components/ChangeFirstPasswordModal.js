import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/axiosInstance";

export default function ChangeFirstPasswordModal({
  visible,
  onClose,
  tempToken,
  onSuccess,
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState(""); 
  const [messageType, setMessageType] = useState("info"); // "error" | "success" | "info"
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    setMessage("");
    if (!newPassword || !confirmPassword) {
      setMessageType("error");
      setMessage("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType("error");
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/auth/changeFirstPassword",
        { newPassword },
        {
          headers: { Authorization: `Bearer ${tempToken}` },
        }
      );

      setMessageType("success");
      setMessage(res.data.message || "Đổi mật khẩu thành công!");
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.log("Change first password error:", error.response?.data || error);
      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Đổi mật khẩu thất bại, vui lòng thử lại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modal}>
            <Text style={styles.title}>Đổi mật khẩu lần đầu</Text>

            {/* Ô nhập mật khẩu mới */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  placeholder="Nhập mật khẩu mới"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={styles.input}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#757575"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  placeholder="Nhập lại mật khẩu mới"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#757575"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {message && loading == false ? (
              <Text
                style={[
                  styles.message,
                  messageType === "error"
                    ? { color: "#d32f2f" }
                    : messageType === "success"
                    ? { color: "#2e7d32" }
                    : { color: "#555" },
                ]}
              >
                {message}
              </Text>
            ) : null}

            {/* Nút xác nhận */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPress={!loading ? handleChangePassword : undefined}
            >
              <Text style={styles.buttonText}>
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </Text>
            </TouchableOpacity>

            {/* Nút hủy */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#004643",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: "#333",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#004643",
    height: 44,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: {
    color: "#757575",
    fontSize: 14,
  },
});
