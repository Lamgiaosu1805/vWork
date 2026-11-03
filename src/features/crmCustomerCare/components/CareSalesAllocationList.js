import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import dayjs from "dayjs";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import useCareSales from "../hooks/useCareSales";
import useUpdateSaleAllocation from "../hooks/useUpdateSaleAllocation";
import { RECEIVING_STATE_META } from "../lib/labels";

const ACTION_META = {
  paused: { title: "Tạm dừng nhận khách", confirm: "Tạm dừng", color: "#D97706" },
  locked: { title: "Khoá nhận khách", confirm: "Khoá", color: "#DC2626" },
};

const ReasonModal = ({ action, sale, onClose, onSubmit, submitting }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const meta = ACTION_META[action];
  if (!meta || !sale) return null;

  const submit = () => {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do");
      return;
    }
    onSubmit(reason.trim());
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>{meta.title}</Text>
          <Text style={styles.boxDesc}>
            Sale: <Text style={styles.bold}>{sale.full_name}</Text>
          </Text>
          {action === "locked" && (
            <Text style={styles.boxWarn}>
              Sale bị khoá sẽ không được phân khách mới; khách do hệ thống/quản lý phân sẽ bị thu hồi ở lượt rà soát hằng ngày (khách giới thiệu, khách nhận qua yêu cầu vẫn giữ).
            </Text>
          )}
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={reason}
            onChangeText={(v) => {
              setReason(v);
              if (error) setError(null);
            }}
            placeholder="Nhập lý do (bắt buộc)"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            autoFocus
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.boxActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8} disabled={submitting}>
              <Text style={styles.cancelText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: meta.color }, submitting && { opacity: 0.6 }]}
              onPress={submit}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmText}>{meta.confirm}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const SaleRow = ({ sale, onAction }) => {
  const state = RECEIVING_STATE_META[sale.receiving_state] ?? { label: sale.receiving_state, color: "#4B5563", bg: "#F3F4F6" };
  const status = sale.allocation_status;
  const canChange = !sale.resigned;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {sale.full_name}
          </Text>
          <Text style={styles.sub}>
            {[sale.ma_nv, sale.role_name, sale.rank ? `Hạng ${sale.rank}` : null].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View style={[styles.stateBadge, { backgroundColor: state.bg }]}>
          <Text style={[styles.stateText, { color: state.color }]}>{state.label}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.stat}>
          Khách mới hôm nay: <Text style={styles.bold}>{sale.new_today ?? 0}/{sale.cap_new_per_day ?? "--"}</Text>
        </Text>
        <Text style={styles.stat}>
          Đang xử lý: <Text style={styles.bold}>{sale.active_load ?? 0}/{sale.cap_total ?? "--"}</Text>
        </Text>
      </View>
      {!!sale.last_assigned_at && (
        <Text style={styles.meta}>Giao gần nhất: {dayjs(sale.last_assigned_at).format("HH:mm DD/MM/YYYY")}</Text>
      )}
      {status !== "open" && !!sale.reason && <Text style={styles.meta}>Lý do: {sale.reason}</Text>}
      {status === "paused" && !!sale.until && (
        <Text style={styles.meta}>Tạm dừng đến: {dayjs(sale.until).format("HH:mm DD/MM/YYYY")}</Text>
      )}

      {canChange && (
        <View style={styles.actions}>
          {status === "open" ? (
            <>
              <TouchableOpacity style={[styles.actionBtn, styles.pauseBtn]} onPress={() => onAction(sale, "paused")} activeOpacity={0.85}>
                <Ionicons name="pause-circle-outline" size={16} color="#B45309" />
                <Text style={[styles.actionText, { color: "#B45309" }]}>Tạm dừng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.lockBtn]} onPress={() => onAction(sale, "locked")} activeOpacity={0.85}>
                <Ionicons name="lock-closed-outline" size={16} color="#B91C1C" />
                <Text style={[styles.actionText, { color: "#B91C1C" }]}>Khoá</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, styles.openBtn]} onPress={() => onAction(sale, "open")} activeOpacity={0.85}>
              <Ionicons name="play-circle-outline" size={16} color="#047857" />
              <Text style={[styles.actionText, { color: "#047857" }]}>Mở lại nhận khách</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const CareSalesAllocationList = ({ appCode }) => {
  const query = useCareSales(appCode);
  const mutation = useUpdateSaleAllocation();
  const [pending, setPending] = useState(null);

  const apply = (sale, status, reason) =>
    mutation.mutate(
      { saleId: sale.sale_id, appCode, status, reason },
      {
        onSuccess: () => {
          setPending(null);
          Toast.show({
            type: "success",
            text1: status === "open" ? "Đã mở lại nhận khách" : status === "paused" ? "Đã tạm dừng nhận khách" : "Đã khoá nhận khách",
            text2: sale.full_name,
          });
        },
        onError: (err) =>
          Toast.show({
            type: "error",
            text1: "Không thể cập nhật",
            text2: err?.response?.data?.message || err?.message || "Lỗi không xác định",
          }),
      },
    );

  const handleAction = (sale, status) => {
    if (status === "open") apply(sale, "open", null);
    else setPending({ sale, status });
  };

  return (
    <>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => String(item.sale_id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} colors={[CRM_COLORS.primary]} />}
        renderItem={({ item }) => <SaleRow sale={item} onAction={handleAction} />}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={CRM_COLORS.primary} style={{ marginTop: 40 }} />
          ) : query.isError ? (
            <View style={styles.center}>
              <Ionicons name="cloud-offline-outline" size={40} color="#CBD5E0" />
              <Text style={styles.centerText}>{query.error?.response?.data?.message || "Không tải được danh sách Sale"}</Text>
              <TouchableOpacity onPress={() => query.refetch()}>
                <Text style={styles.retry}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="people-outline" size={40} color="#CBD5E0" />
              <Text style={styles.centerText}>Chưa có Sale nào trong phạm vi quản lý</Text>
            </View>
          )
        }
      />

      {!!pending && (
        <ReasonModal
          action={pending.status}
          sale={pending.sale}
          submitting={mutation.isPending}
          onClose={() => setPending(null)}
          onSubmit={(reason) => apply(pending.sale, pending.status, reason)}
        />
      )}
    </>
  );
};

export default CareSalesAllocationList;

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#F3F4F6" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 15, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  stateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: CRM_RADIUS.pill },
  stateText: { fontSize: 11, fontWeight: "800" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, marginTop: 10 },
  stat: { fontSize: 12, color: "#6B7280" },
  bold: { fontWeight: "800", color: "#111827" },
  meta: { fontSize: 12, color: "#4B5563", marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: CRM_RADIUS.md, borderWidth: 1 },
  pauseBtn: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  lockBtn: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  openBtn: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  actionText: { fontSize: 13, fontWeight: "800" },
  center: { alignItems: "center", paddingVertical: 48, gap: 10 },
  centerText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  retry: { fontSize: 13, color: CRM_COLORS.primary, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  box: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.xl, padding: 20 },
  boxTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 6 },
  boxDesc: { fontSize: 13, color: "#4B5563", marginBottom: 8 },
  boxWarn: { fontSize: 12, color: "#B91C1C", backgroundColor: "#FEF2F2", borderRadius: CRM_RADIUS.sm, padding: 10, marginBottom: 10, lineHeight: 17 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: CRM_RADIUS.md, padding: 12, minHeight: 90, fontSize: 13, color: "#111827", backgroundColor: "#F9FAFB" },
  inputError: { borderColor: "#F87171" },
  errorText: { fontSize: 12, color: "#DC2626", marginTop: 6 },
  boxActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: CRM_RADIUS.md, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  cancelText: { fontWeight: "700", color: "#374151" },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: CRM_RADIUS.md, alignItems: "center", justifyContent: "center" },
  confirmText: { color: "#fff", fontWeight: "800" },
});
