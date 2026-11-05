import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TICKET_PRIMARY } from "../constants";

// Khung bottom sheet dùng chung cho mọi form thao tác (Báo xong, Đóng, Tạm hoãn, Giao việc...): icon + tiêu đề,
// nội dung cuộn được, chân có nút Huỷ / nút chính.
const TicketSheet = ({
  visible,
  onClose,
  icon,
  iconColor = TICKET_PRIMARY,
  iconBg = "#FFF3EE",
  title,
  subtitle,
  children,
  submitLabel,
  onSubmit,
  submitting = false,
  submitDisabled = false,
  submitColor = TICKET_PRIMARY,
  error,
  fullHeight = false,
  footer,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, fullHeight && styles.sheetFull]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            {icon && (
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {!!subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={fullHeight ? { flex: 1 } : styles.bodyScroll}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {children}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {footer ??
            (onSubmit && (
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: submitColor },
                    (submitDisabled || submitting) && styles.submitDisabled,
                  ]}
                  disabled={submitDisabled || submitting}
                  onPress={onSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[styles.submitText, submitDisabled && styles.submitTextDisabled]}
                    >
                      {submitLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const SheetField = ({ label, required, hint, children, style }) => (
  <View style={[styles.field, style]}>
    {!!label && (
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
    )}
    {children}
    {!!hint && <Text style={styles.hint}>{hint}</Text>}
  </View>
);

export const InfoNote = ({ children, tone = "info" }) => {
  const palette =
    tone === "warning"
      ? { bg: "#FFF7ED", color: "#9A3412", icon: "#C2410C" }
      : { bg: "#EFF3FF", color: "#1E3A8A", icon: "#1D4ED8" };
  return (
    <View style={[styles.note, { backgroundColor: palette.bg }]}>
      <Ionicons name="information-circle-outline" size={16} color={palette.icon} />
      <Text style={[styles.noteText, { color: palette.color }]}>{children}</Text>
    </View>
  );
};

export default TicketSheet;

export const sheetInputStyle = {
  minHeight: 44,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  backgroundColor: "#F9FAFB",
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 14,
  color: "#111827",
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.45)" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 8,
  },
  sheetFull: { height: "90%" },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "800", color: "#1A1D26" },
  subtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  bodyScroll: { flexGrow: 0 },
  body: { padding: 16, paddingTop: 18, gap: 16 },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "700", color: "#374151" },
  submitBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { backgroundColor: "#E5E7EB" },
  submitText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  submitTextDisabled: { color: "#9CA3AF" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151" },
  required: { color: "#DC2626" },
  hint: { fontSize: 12, color: "#6B7280", lineHeight: 17 },
  note: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },
  errorText: { flex: 1, fontSize: 13, color: "#B91C1C" },
});
