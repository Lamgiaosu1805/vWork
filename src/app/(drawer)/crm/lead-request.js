import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, FlatList, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { ChevronLeft } from "lucide-react-native";

import Header from "../../../components/Header";
import { Skeleton } from "../../../components/Skeleton";
import { canMgr } from "../../../helpers/permissions";
import { CRM_COLORS, CRM_RADIUS } from "../../../features/crm/theme/colors";
import useSubmitClaimRequest from "../../../features/crmLeadRequest/hooks/useSubmitClaimRequest";
import useMyClaimRequests from "../../../features/crmLeadRequest/hooks/useMyClaimRequests";
import useAllClaimRequests from "../../../features/crmLeadRequest/hooks/useAllClaimRequests";
import useApproveClaimRequest from "../../../features/crmLeadRequest/hooks/useApproveClaimRequest";
import useRejectClaimRequest from "../../../features/crmLeadRequest/hooks/useRejectClaimRequest";
import useRevokeClaimRequest from "../../../features/crmLeadRequest/hooks/useRevokeClaimRequest";

const APP_CODE = "tikluy";
const PRIMARY = CRM_COLORS.primary;

const STATUS_CFG = {
  pending: { label: "Chờ duyệt", bg: "#FEF3C7", color: "#D97706" },
  approved: { label: "Đã duyệt", bg: "#D1FAE5", color: "#059669" },
  rejected: { label: "Từ chối", bg: "#FEE2E2", color: "#DC2626" },
  revoked: { label: "Đã hủy phân công", bg: "#F3E8FF", color: "#7C3AED" },
};

const STATUS_FILTERS = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Từ chối" },
  { key: "revoked", label: "Đã hủy" },
  { key: "all", label: "Tất cả" },
];

function RequestCardSkeleton() {
  return (
    <View style={styles.reqCard}>
      <View style={styles.reqCardRow}>
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="45%" height={14} />
          <Skeleton width="35%" height={12} />
        </View>
        <Skeleton width={70} height={20} borderRadius={10} />
      </View>
      <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="30%" height={11} style={{ marginTop: 8 }} />
    </View>
  );
}

function GuideBox() {
  return (
    <View style={styles.guideBox}>
      <View style={styles.guideHeader}>
        <Ionicons name="information-circle" size={18} color={CRM_COLORS.accent} />
        <Text style={styles.guideTitle}>Hướng dẫn gửi yêu cầu</Text>
      </View>
      <View style={styles.guideList}>
        <Text style={styles.guideLine}>• Dùng khi khách bạn giới thiệu <Text style={styles.bold}>quên nhập mã</Text> khi đăng ký.</Text>
        <Text style={styles.guideLine}>• Gửi yêu cầu trong <Text style={styles.bold}>4 tiếng</Text> từ lúc khách đăng ký.</Text>
        <Text style={styles.guideLine}>• Nếu khách đăng ký sau <Text style={styles.bold}>13:00</Text>, deadline là <Text style={styles.bold}>10:00 hôm sau</Text>.</Text>
        <Text style={styles.guideLine}>• Ghi rõ bối cảnh gặp gỡ để Admin có cơ sở xét duyệt.</Text>
        <Text style={styles.guideLine}>• Sau thời hạn, liên hệ Admin trực tiếp để được hỗ trợ.</Text>
      </View>
    </View>
  );
}

function SubmitTab() {
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const submitMutation = useSubmitClaimRequest();

  const handleSubmit = async () => {
    if (!phone.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập số điện thoại khách hàng" });
      return;
    }
    if (!note.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập ghi chú bối cảnh giới thiệu" });
      return;
    }
    try {
      await submitMutation.mutateAsync({ app_code: APP_CODE, phone_number: phone.trim(), note: note.trim() });
      Toast.show({ type: "success", text1: "Gửi yêu cầu thành công", text2: "Admin sẽ xem xét và phản hồi sớm." });
      setPhone("");
      setNote("");
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Có lỗi xảy ra" });
    }
  };

  return (
    <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled">
      <GuideBox />

      <View style={styles.formSection}>
        <Text style={styles.label}>Số điện thoại khách hàng *</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Ví dụ: 0901234567" keyboardType="phone-pad" maxLength={12} placeholderTextColor="#9CA3AF" />

        <Text style={[styles.label, { marginTop: 16 }]}>Ghi chú — bối cảnh giới thiệu *</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={note}
          onChangeText={setNote}
          placeholder="Ví dụ: Gặp khách tại hội chợ ngày 19/05, đã hướng dẫn cài app và đăng ký nhưng khách quên nhập mã giới thiệu của tôi..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.hint}>Ghi rõ thời điểm, địa điểm gặp gỡ hoặc kênh giới thiệu.</Text>

        <TouchableOpacity
          style={[styles.submitBtn, (!phone.trim() || !note.trim() || submitMutation.isPending) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!phone.trim() || !note.trim() || submitMutation.isPending}
          activeOpacity={0.8}
        >
          {submitMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Gửi yêu cầu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MyRequestsTab() {
  const query = useMyClaimRequests();
  const requests = useMemo(() => query.data?.pages?.flatMap((p) => p.items) ?? [], [query.data]);

  const renderItem = ({ item }) => {
    const cfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
    const customerName = item.customer_id?.identity?.full_name || "Chưa eKYC";
    return (
      <View style={styles.reqCard}>
        <View style={styles.reqCardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reqPhone}>{item.phone_number}</Text>
            <Text style={styles.reqName}>{customerName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        {item.note ? <Text style={styles.reqNote} numberOfLines={2}>"{item.note}"</Text> : null}
        {item.status === "rejected" && item.reject_reason ? <Text style={styles.reqReject}>Lý do: {item.reject_reason}</Text> : null}
        <Text style={styles.reqDate}>Gửi lúc: {item.createdAt}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      onRefresh={() => query.refetch()}
      refreshing={query.isRefetching}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        query.isLoading ? (
          <View style={{ gap: 12 }}>
            <RequestCardSkeleton />
            <RequestCardSkeleton />
            <RequestCardSkeleton />
          </View>
        ) : (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>Bạn chưa gửi yêu cầu nào</Text>
          </View>
        )
      }
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
    />
  );
}

function AdminRequestsTab({ isAdmin }) {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");

  const query = useAllClaimRequests(statusFilter);
  const requests = useMemo(() => query.data?.pages?.flatMap((p) => p.items) ?? [], [query.data]);

  const approveMutation = useApproveClaimRequest();
  const rejectMutation = useRejectClaimRequest();
  const revokeMutation = useRevokeClaimRequest();
  const actionLoading = approveMutation.isPending || rejectMutation.isPending || revokeMutation.isPending;

  const handleApprove = (item) => {
    Alert.alert(
      "Xác nhận duyệt",
      `Duyệt yêu cầu của ${item.sale_id?.full_name || "sale"} cho KH ${item.phone_number}?\n\nHH mở CIF (10.000đ) sẽ được ghi nhận cho sale.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Duyệt",
          onPress: async () => {
            try {
              await approveMutation.mutateAsync(item._id);
              Toast.show({ type: "success", text1: "Đã duyệt yêu cầu" });
            } catch (err) {
              Toast.show({ type: "error", text1: err?.response?.data?.message || "Có lỗi xảy ra" });
            }
          },
        },
      ],
    );
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập lý do từ chối" });
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget._id, payload: { reject_reason: rejectReason.trim() } });
      Toast.show({ type: "success", text1: "Đã từ chối yêu cầu" });
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Có lỗi xảy ra" });
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync({ id: revokeTarget._id, payload: revokeReason.trim() ? { reason: revokeReason.trim() } : {} });
      Toast.show({ type: "success", text1: "Đã hủy phân công sale" });
      setRevokeTarget(null);
      setRevokeReason("");
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Có lỗi xảy ra" });
    }
  };

  if (query.isLoading && requests.length === 0) {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <RequestCardSkeleton />
        <RequestCardSkeleton />
        <RequestCardSkeleton />
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const cfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
    const customerName = item.customer_id?.identity?.full_name || "Chưa eKYC";
    const saleName = item.sale_id?.full_name || item.sale_id?.username || "—";
    const isPending = item.status === "pending";
    const isApproved = item.status === "approved";
    const isRevoked = item.status === "revoked";

    return (
      <View style={styles.reqCard}>
        <View style={styles.reqCardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reqPhone}>{item.phone_number}</Text>
            <Text style={styles.reqName}>{customerName}</Text>
            <Text style={styles.reqSale}>Sale: {saleName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {item.note ? <Text style={styles.reqNote} numberOfLines={2}>"{item.note}"</Text> : null}
        {item.status === "rejected" && item.reject_reason ? <Text style={styles.reqReject}>Lý do từ chối: {item.reject_reason}</Text> : null}
        {isRevoked && item.revoke_reason ? <Text style={styles.reqRevoke}>Lý do hủy: {item.revoke_reason}</Text> : null}

        <Text style={styles.reqDate}>Gửi lúc: {item.createdAt}</Text>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApprove(item)} disabled={actionLoading} activeOpacity={0.8}>
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => setRejectTarget(item)} disabled={actionLoading} activeOpacity={0.8}>
              <Ionicons name="close" size={14} color="#DC2626" />
              <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}

        {isApproved && isAdmin && (
          <View style={[styles.actionRow, { marginTop: 8 }]}>
            <TouchableOpacity style={[styles.actionBtn, styles.revokeBtn]} onPress={() => setRevokeTarget(item)} disabled={actionLoading} activeOpacity={0.8}>
              <Ionicons name="person-remove-outline" size={14} color="#7C3AED" />
              <Text style={[styles.actionBtnText, { color: "#7C3AED" }]}>Hủy phân công</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity key={f.key} style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]} onPress={() => setStatusFilter(f.key)}>
            <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onRefresh={() => query.refetch()}
        refreshing={query.isRefetching}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>Không có yêu cầu nào</Text>
          </View>
        }
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
      />

      <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => { setRejectTarget(null); setRejectReason(""); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Lý do từ chối</Text>
            <Text style={styles.modalSub}>Yêu cầu của {rejectTarget?.sale_id?.full_name || "sale"} — KH {rejectTarget?.phone_number}</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { marginTop: 14 }]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Ví dụ: Không tìm thấy khách hàng với SĐT này..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setRejectTarget(null); setRejectReason(""); }} disabled={actionLoading}>
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalRejectBtn, (!rejectReason.trim() || actionLoading) && styles.submitBtnDisabled]} onPress={handleReject} disabled={!rejectReason.trim() || actionLoading} activeOpacity={0.8}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalRejectText}>Xác nhận từ chối</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!revokeTarget} transparent animationType="fade" onRequestClose={() => { setRevokeTarget(null); setRevokeReason(""); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { color: "#7C3AED" }]}>Hủy phân công sale</Text>
            <Text style={styles.modalSub}>{revokeTarget?.sale_id?.full_name || "Sale"} — KH {revokeTarget?.phone_number}</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { marginTop: 14 }]}
              value={revokeReason}
              onChangeText={setRevokeReason}
              placeholder="Lý do (không bắt buộc)..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setRevokeTarget(null); setRevokeReason(""); }} disabled={actionLoading}>
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalRevokeBtn, actionLoading && styles.submitBtnDisabled]} onPress={handleRevoke} disabled={actionLoading} activeOpacity={0.8}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalRevokeText}>Xác nhận hủy</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function LeadRequestScreen() {
  const user = useSelector((state) => state.auth.user);
  const isManager = canMgr(user, "crm");
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState("submit");

  const tabs = [
    { key: "submit", label: "Gửi yêu cầu" },
    { key: "history", label: "Của tôi" },
    ...(isManager ? [{ key: "admin", label: "Duyệt yêu cầu" }] : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <Header title="Yêu cầu nhận KH" LeftIcon={ChevronLeft} onLeftPress={() => router.back()} />

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "submit" && <SubmitTab />}
      {activeTab === "history" && <MyRequestsTab />}
      {activeTab === "admin" && <AdminRequestsTab isAdmin={isAdmin} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CRM_COLORS.background },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: PRIMARY },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  tabLabelActive: { color: PRIMARY },
  tabContent: { flex: 1 },
  guideBox: { margin: 16, padding: 14, backgroundColor: "#EFF3FF", borderRadius: CRM_RADIUS.sm, borderWidth: 1, borderColor: "#BFDBFE" },
  guideHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  guideTitle: { fontSize: 13, fontWeight: "700", color: CRM_COLORS.accentDark },
  guideList: { gap: 4 },
  guideLine: { fontSize: 12, color: "#1E40AF", lineHeight: 19 },
  bold: { fontWeight: "700" },
  formSection: { paddingHorizontal: 16, paddingBottom: 32 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: CRM_RADIUS.sm, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#111827" },
  inputMulti: { minHeight: 96, paddingTop: 11 },
  hint: { fontSize: 11, color: "#9CA3AF", marginTop: 5 },
  submitBtn: { marginTop: 24, backgroundColor: PRIMARY, borderRadius: CRM_RADIUS.sm, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  listContent: { padding: 16, gap: 12, flexGrow: 1 },
  reqCard: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.md, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1 },
  reqCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reqPhone: { fontSize: 15, fontWeight: "700", color: "#111827" },
  reqName: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  reqSale: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  reqNote: { fontSize: 12, color: "#6B7280", fontStyle: "italic", marginTop: 8, lineHeight: 18 },
  reqReject: { fontSize: 12, color: "#DC2626", marginTop: 6 },
  reqRevoke: { fontSize: 12, color: "#7C3AED", marginTop: 6 },
  reqDate: { fontSize: 11, color: "#9CA3AF", marginTop: 8 },
  filterBar: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  filterBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: "row" },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },
  filterChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  filterChipTextActive: { color: "#fff" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 9 },
  approveBtn: { backgroundColor: "#059669" },
  rejectBtn: { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FECACA" },
  revokeBtn: { backgroundColor: "#F3E8FF", borderWidth: 1, borderColor: "#DDD6FE" },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.lg, padding: 20, width: "100%" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 4 },
  modalSub: { fontSize: 12, color: "#6B7280" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  modalRejectBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: "#DC2626", alignItems: "center" },
  modalRejectText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  modalRevokeBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: "#7C3AED", alignItems: "center" },
  modalRevokeText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
