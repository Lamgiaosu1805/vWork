import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import useCrmSalesUsers from "../hooks/useCrmSalesUsers";
import useAssignCustomer from "../hooks/useAssignCustomer";
import useReassignCustomer from "../hooks/useReassignCustomer";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";

const PRIMARY = CRM_COLORS.primary;

const AssignCustomerModal = ({ customer, onClose, onSuccess }) => {
  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState("");

  const isReassign = !!customer?.referred_by;

  const { data: users = [], isLoading: loadingUsers } = useCrmSalesUsers({ search: debouncedSearch, limit: 30, page: 1 }, { enabled: !!customer });
  const assignMutation = useAssignCustomer();
  const reassignMutation = useReassignCustomer();
  const submitting = assignMutation.isPending || reassignMutation.isPending;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  const handleSubmit = async () => {
    if (!selectedUser) {
      Toast.show({ type: "error", text1: "Vui lòng chọn sale phụ trách" });
      return;
    }
    if (isReassign && !reason.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập lý do chuyển sale" });
      return;
    }

    try {
      if (isReassign) {
        await reassignMutation.mutateAsync({
          id: customer._id,
          payload: { sale_user_info_id: selectedUser._id, reason: reason.trim(), include_cif_hh: false, include_ekyc_hh: false },
        });
        Toast.show({ type: "success", text1: "Chuyển sale thành công" });
      } else {
        await assignMutation.mutateAsync({ id: customer._id, payload: { sale_user_info_id: selectedUser._id } });
        Toast.show({ type: "success", text1: "Phân khách thành công" });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Có lỗi xảy ra" });
    }
  };

  if (!customer) return null;

  const customerName = customer.identity?.full_name || customer.phone_number;
  const currentSaleName = customer.referred_by?.full_name;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.header}>
            <Text style={styles.title}>{isReassign ? "Chuyển sale phụ trách" : "Phân khách về cho sale"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.infoBox}>
              <Text style={styles.infoName}>{customerName}</Text>
              <Text style={styles.infoPhone}>SĐT: {customer.phone_number}</Text>
              {currentSaleName && <Text style={styles.infoSale}>Sale hiện tại: {currentSaleName}</Text>}
            </View>

            {isReassign && (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  Thao tác này sẽ đổi sale phụ trách. Hoa hồng đã ghi nhận trước đó vẫn được giữ nguyên và mọi thay đổi đều có audit log.
                </Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>{isReassign ? "Sale mới phụ trách *" : "Chọn sale phụ trách *"}</Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={15} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Tìm theo tên, mã NV..."
                placeholderTextColor="#9CA3AF"
              />
              {loadingUsers && <ActivityIndicator size="small" color={PRIMARY} />}
            </View>

            {users.length > 0 && (
              <View style={styles.userList}>
                {users.map((u) => {
                  const isSelected = selectedUser?._id === u._id;
                  return (
                    <TouchableOpacity
                      key={u._id}
                      style={[styles.userItem, isSelected && styles.userItemSelected]}
                      onPress={() => setSelectedUser(u)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.userItemContent}>
                        <View style={[styles.userAvatar, isSelected && { backgroundColor: PRIMARY }]}>
                          <Text style={[styles.userAvatarText, isSelected && { color: "#fff" }]}>
                            {(u.full_name || u.username || "?")[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.userName, isSelected && { color: PRIMARY }]}>{u.full_name || u.username}</Text>
                          <Text style={styles.userMeta}>{u.ma_nv ? `${u.ma_nv} · ` : ""}{u.phone_number || ""}</Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color={PRIMARY} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {isReassign && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Lý do chuyển sale *</Text>
                <TextInput
                  style={[styles.searchBox, styles.inputMulti]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Ví dụ: Khách thực tế do sale A chăm sóc, nhầm khi phân..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, (!selectedUser || (isReassign && !reason.trim()) || submitting) && styles.confirmBtnDisabled]}
              onPress={handleSubmit}
              disabled={!selectedUser || (isReassign && !reason.trim()) || submitting}
              activeOpacity={0.8}
            >
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmBtnText}>{isReassign ? "Xác nhận chuyển sale" : "Xác nhận phân khách"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AssignCustomerModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  box: { backgroundColor: "#fff", borderTopLeftRadius: CRM_RADIUS.xl, borderTopRightRadius: CRM_RADIUS.xl, maxHeight: "90%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  title: { fontSize: 17, fontWeight: "800", color: "#111827" },
  closeBtn: { padding: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  infoBox: { backgroundColor: "#F9FAFB", borderRadius: CRM_RADIUS.sm, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  infoName: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 3 },
  infoPhone: { fontSize: 13, color: "#6B7280" },
  infoSale: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  warnBox: { backgroundColor: "#FFF3EE", borderRadius: CRM_RADIUS.sm, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FED7AA" },
  warnText: { fontSize: 12, color: CRM_COLORS.primaryDark, lineHeight: 18 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: CRM_RADIUS.sm, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 13, color: "#111827" },
  inputMulti: { alignItems: "flex-start", minHeight: 80, paddingTop: 10, flexDirection: "column" },
  userList: { gap: 6, marginBottom: 8 },
  userItem: { borderRadius: CRM_RADIUS.sm, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", overflow: "hidden" },
  userItemSelected: { borderColor: PRIMARY, backgroundColor: "#FFF3EE" },
  userItemContent: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  userName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  userMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: CRM_RADIUS.sm, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  confirmBtn: { flex: 2, paddingVertical: 13, borderRadius: CRM_RADIUS.sm, backgroundColor: PRIMARY, alignItems: "center" },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
