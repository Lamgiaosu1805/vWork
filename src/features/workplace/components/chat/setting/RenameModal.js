import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";

const RenameModal = ({ visible, initialName, onClose, onSave, saving }) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Đổi tên nhóm</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nhập tên nhóm mới..."
              placeholderTextColor="#9CA3AF"
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={() =>
                name.trim() && !saving && onSave(name.trim())
              }
            />
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={onClose}
              >
                <Text style={styles.btnCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnSave,
                  (!name.trim() || saving) && styles.btnDisabled,
                ]}
                onPress={() => name.trim() && !saving && onSave(name.trim())}
                disabled={!name.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.btnSaveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default RenameModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  btnRow: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: { backgroundColor: "#F3F4F6" },
  btnCancelText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  btnSave: { backgroundColor: "#0F766E" },
  btnSaveText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  btnDisabled: { opacity: 0.45 },
});
