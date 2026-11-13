import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useMemo } from "react";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { ClipboardList } from "lucide-react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import useCustomerCarePermissions from "../hooks/useCustomerCarePermissions";
import useCustomerCareHistory from "../hooks/useCustomerCareHistory";
import useCustomerInteractions from "../hooks/useCustomerInteractions";
import { openCareReport } from "../lib/careReportRef";
import {
  CHANNEL_LABELS,
  CONTACT_RESULT_OPTIONS,
  ENDED_REASON_LABELS,
  INTERACTION_TYPE_OPTIONS,
  LOST_REASON_OPTIONS,
  POOL_STATUS_LABELS,
  PRIORITY_META,
  RESULT_OPTIONS,
  SYSTEM_INTERACTION_LABELS,
  labelOf,
} from "../lib/labels";

const fmt = (value) => (value ? dayjs(value).format("HH:mm DD/MM/YYYY") : "--");
const saleLabel = (sale) => (sale?.full_name ? `${sale.full_name}${sale.ma_nv ? ` (${sale.ma_nv})` : ""}` : "--");

const SectionTitle = ({ text }) => <Text style={styles.sectionTitle}>{text}</Text>;

const InfoLine = ({ label, value }) =>
  value ? (
    <Text style={styles.line}>
      <Text style={styles.lineLabel}>{label}: </Text>
      {value}
    </Text>
  ) : null;

const InlineState = ({ loading, error, empty, emptyText, onRetry }) => {
  if (loading) return <ActivityIndicator color={CRM_COLORS.primary} style={{ marginVertical: 16 }} />;
  if (error) {
    return (
      <View style={styles.inlineState}>
        <Text style={styles.inlineText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry}>
            <Text style={styles.retry}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.inlineState}>
        <Text style={styles.inlineText}>{emptyText}</Text>
      </View>
    );
  }
  return null;
};

const InteractionItem = ({ item }) => {
  const isReport = INTERACTION_TYPE_OPTIONS.some((o) => o.value === item.type);
  const typeLabel = isReport
    ? labelOf(INTERACTION_TYPE_OPTIONS, item.type)
    : SYSTEM_INTERACTION_LABELS[item.type] ?? item.type;

  return (
    <View style={[styles.item, !isReport && styles.itemSystem]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemType, !isReport && styles.itemTypeSystem]}>{typeLabel}</Text>
        {item.is_valid_activity && (
          <View style={styles.validBadge}>
            <Text style={styles.validText}>Hợp lệ SLA</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Text style={styles.itemTime}>{fmt(item.createdAt)}</Text>
      </View>
      <InfoLine label="Người thực hiện" value={item.sale_id?.full_name} />
      <InfoLine label="Kết quả liên hệ" value={item.contact_result && labelOf(CONTACT_RESULT_OPTIONS, item.contact_result)} />
      <InfoLine label="Trạng thái" value={item.result && labelOf(RESULT_OPTIONS, item.result)} />
      <InfoLine label="Nhu cầu" value={item.customer_need} />
      <InfoLine label="Lý do từ chối" value={item.lost_reason && labelOf(LOST_REASON_OPTIONS, item.lost_reason)} />
      <InfoLine label="Bước tiếp theo" value={item.next_action?.description} />
      <InfoLine label="Lịch hẹn" value={item.next_action?.due_date && fmt(item.next_action.due_date)} />
      <InfoLine label="Ghi chú" value={item.content} />
      <InfoLine label="Lý do" value={item.metadata?.reason} />
    </View>
  );
};

const AssignmentItem = ({ item }) => {
  const priority = PRIORITY_META[item.priority_class];
  const active = item.status === "active";
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemType}>Vòng {item.round ?? 1}</Text>
        {!!priority && (
          <View style={[styles.smallBadge, { backgroundColor: priority.bg }]}>
            <Text style={[styles.smallBadgeText, { color: priority.color }]}>{priority.label}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <View style={[styles.smallBadge, { backgroundColor: active ? "#ECFDF5" : "#F3F4F6" }]}>
          <Text style={[styles.smallBadgeText, { color: active ? "#047857" : "#4B5563" }]}>
            {active ? "Đang giữ" : "Đã kết thúc"}
          </Text>
        </View>
      </View>
      <InfoLine label="Sale" value={saleLabel(item.sale_id)} />
      <InfoLine label="Kênh giao" value={CHANNEL_LABELS[item.channel] ?? item.channel} />
      <InfoLine label="Giao lúc" value={fmt(item.assigned_at)} />
      <InfoLine
        label="Liên hệ lần đầu"
        value={item.first_contact_at ? `${fmt(item.first_contact_at)}${item.first_contact_breached ? " (trễ hạn)" : ""}` : "Chưa liên hệ"}
      />
      {!active && <InfoLine label="Kết thúc" value={`${fmt(item.ended_at)} — ${ENDED_REASON_LABELS[item.ended_reason] ?? item.ended_reason ?? ""}`} />}
      <InfoLine label="Ghi chú" value={item.end_note} />
    </View>
  );
};

/**
 * Mục "Lịch sử chăm sóc & giao khách" ở chi tiết khách. `customerId` (_id Mongo) cần cho lịch sử lượt
 * giao; thiếu thì chỉ hiện báo cáo chăm sóc (route chi tiết hiện mở bằng externalId).
 */
const CustomerCareHistorySection = ({ externalId, customerId, customerName, phoneNumber }) => {
  const {
    canViewCareReports,
    canCreateCareReport,
    showCustomerCareQueue,
    showCustomerCareMgmt,
  } = useCustomerCarePermissions();
  const canViewAssignments = showCustomerCareQueue || showCustomerCareMgmt;

  const historyQuery = useCustomerCareHistory(customerId, canViewAssignments);
  const interactionsQuery = useCustomerInteractions(externalId, canViewCareReports);

  const interactions = useMemo(
    () => interactionsQuery.data?.pages?.flatMap((p) => p.items) ?? [],
    [interactionsQuery.data],
  );
  const state = historyQuery.data?.state;
  const assignments = historyQuery.data?.history ?? [];

  const handleReport = () =>
    openCareReport({
      customer: {
        _id: customerId,
        external_id: externalId,
        phone_number: phoneNumber,
        identity: { full_name: customerName },
      },
      source: "manual",
    });

  const errorText = (q, fallback) => (q.isError ? q.error?.response?.data?.message || fallback : null);

  return (
    <View style={styles.root}>
      {canCreateCareReport && (
        <TouchableOpacity style={styles.reportBtn} activeOpacity={0.85} onPress={handleReport}>
          <ClipboardList size={18} color="#fff" />
          <Text style={styles.reportBtnText}>Báo cáo chăm sóc</Text>
        </TouchableOpacity>
      )}

      {canViewAssignments && !!customerId && (
        <>
          <SectionTitle text="Lịch sử giao khách" />
          {!!state && (
            <View style={styles.stateCard}>
              <InfoLine label="Tình trạng" value={POOL_STATUS_LABELS[state.pool_status] ?? state.pool_status} />
              <InfoLine label="Nhóm" value={PRIORITY_META[state.priority_class]?.label} />
              <InfoLine label="Số vòng đã giao" value={state.round_count != null ? String(state.round_count) : null} />
              <InfoLine label="Sale đang giữ" value={state.current_sale_id ? saleLabel(state.current_sale_id) : null} />
            </View>
          )}
          <InlineState
            loading={historyQuery.isLoading}
            error={errorText(historyQuery, "Không tải được lịch sử giao khách")}
            empty={!historyQuery.isLoading && !historyQuery.isError && assignments.length === 0}
            emptyText="Khách chưa có lượt giao nào"
            onRetry={() => historyQuery.refetch()}
          />
          {assignments.map((a) => (
            <AssignmentItem key={a._id} item={a} />
          ))}
        </>
      )}

      {canViewCareReports ? (
        <>
          <SectionTitle text="Lịch sử chăm sóc" />
          <InlineState
            loading={interactionsQuery.isLoading}
            error={errorText(interactionsQuery, "Không tải được lịch sử chăm sóc")}
            empty={!interactionsQuery.isLoading && !interactionsQuery.isError && interactions.length === 0}
            emptyText="Chưa có báo cáo chăm sóc nào"
            onRetry={() => interactionsQuery.refetch()}
          />
          {interactions.map((it) => (
            <InteractionItem key={it._id} item={it} />
          ))}
          {interactionsQuery.hasNextPage && (
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => interactionsQuery.fetchNextPage()}
              disabled={interactionsQuery.isFetchingNextPage}
            >
              {interactionsQuery.isFetchingNextPage ? (
                <ActivityIndicator size="small" color={CRM_COLORS.primary} />
              ) : (
                <Text style={styles.moreText}>Xem thêm</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      ) : (
        !canViewAssignments && (
          <View style={styles.inlineState}>
            <Ionicons name="lock-closed-outline" size={28} color="#D1D5DB" />
            <Text style={styles.inlineText}>Bạn không có quyền xem lịch sử chăm sóc</Text>
          </View>
        )
      )}
    </View>
  );
};

export default CustomerCareHistorySection;

const styles = StyleSheet.create({
  root: { paddingHorizontal: 16, paddingTop: 8 },
  reportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: CRM_COLORS.primary, borderRadius: CRM_RADIUS.md, paddingVertical: 13, marginBottom: 8 },
  reportBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#111827", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 },
  stateCard: { backgroundColor: "#FFF7ED", borderRadius: CRM_RADIUS.md, padding: 12, marginBottom: 10, gap: 2 },
  item: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#F3F4F6", gap: 2 },
  itemSystem: { backgroundColor: "#F9FAFB" },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  itemType: { fontSize: 13, fontWeight: "800", color: CRM_COLORS.primary },
  itemTypeSystem: { color: "#4B5563" },
  itemTime: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  validBadge: { backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: CRM_RADIUS.pill },
  validText: { fontSize: 9, fontWeight: "800", color: "#047857" },
  smallBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: CRM_RADIUS.pill },
  smallBadgeText: { fontSize: 10, fontWeight: "800" },
  line: { fontSize: 12, color: "#374151", lineHeight: 18 },
  lineLabel: { color: "#6B7280", fontWeight: "600" },
  inlineState: { alignItems: "center", paddingVertical: 20, gap: 8 },
  inlineText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  retry: { fontSize: 13, color: CRM_COLORS.primary, fontWeight: "700" },
  moreBtn: { alignItems: "center", paddingVertical: 12 },
  moreText: { color: CRM_COLORS.primary, fontWeight: "700", fontSize: 13 },
});
