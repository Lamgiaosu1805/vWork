import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthAvatar } from "../../../PostCard";
import { COLORS } from "../../../../assets/theme/colors";

const NicknameModal = ({
  visible,
  member,
  initialValue,
  onClose,
  onSave,
  saving,
}) => {
  const [value, setValue] = useState(initialValue ?? "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) setValue(initialValue ?? "");
  }, [visible, initialValue]);

  const handleSave = () => {
    if (saving) return;
    onSave?.(value.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.card}
            >
              <View style={styles.headerRow}>
                <Text style={styles.title}>Chỉnh sửa biệt danh</Text>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.memberRow}>
                <AuthAvatar
                  filename={member?.avatar}
                  name={member?.full_name}
                  size={44}
                  cacheKey={member?.updatedAt}
                />
                <Text style={styles.memberName} numberOfLines={1}>
                  {member?.full_name ?? "Thành viên"}
                </Text>
              </View>

              <Text style={styles.hint}>
                Mọi người trong cuộc trò chuyện sẽ thấy biệt danh này.
              </Text>

              <View style={styles.inputWrap}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Nhập biệt danh..."
                  placeholderTextColor="#9CA3AF"
                  value={value}
                  onChangeText={setValue}
                  autoFocus
                  maxLength={50}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
                {value.length > 0 && (
                  <TouchableOpacity onPress={() => setValue("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveText}>Lưu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default NicknameModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  memberName: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1 },
  hint: { fontSize: 12, color: "#9CA3AF", marginBottom: 12, lineHeight: 17 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 18,
  },
  cancelBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 8 },
  cancelText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  saveBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: COLORS.Primary,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontSize: 14, color: "#FFF", fontWeight: "600" },
});
