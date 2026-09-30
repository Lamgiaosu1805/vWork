import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { PhoneCall } from "lucide-react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";

const ConfirmCallModal = ({ customer, onClose, onConfirm }) => {
  if (!customer) return null;
  const name = customer.identity?.full_name || customer.phone_number;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.iconWrap}>
            <PhoneCall size={22} color={CRM_COLORS.primary} strokeWidth={2.5} />
          </View>

          <Text style={styles.title}>Xác nhận gọi điện</Text>

          <Text style={styles.desc}>
            Bạn có chắc chắn muốn thực hiện cuộc gọi đến <Text style={styles.bold}>{name}</Text> ({customer.phone_number})?
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
              <PhoneCall size={14} color="#fff" />
              <Text style={styles.confirmText}>Xác nhận gọi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmCallModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 24 },
  box: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.xl, padding: 24, width: "100%", maxWidth: 340, alignItems: "center" },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFF3EE", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 10 },
  desc: { fontSize: 12, color: "#6B7280", textAlign: "center", lineHeight: 18, marginBottom: 20, paddingHorizontal: 8 },
  bold: { fontWeight: "700", color: "#374151" },
  actions: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: CRM_RADIUS.md, borderWidth: 1, borderColor: CRM_COLORS.primary, alignItems: "center" },
  cancelText: { color: CRM_COLORS.primary, fontWeight: "700", fontSize: 12 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: CRM_RADIUS.md, backgroundColor: "#2563EB", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
