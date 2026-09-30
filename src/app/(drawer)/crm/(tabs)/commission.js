import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { Menu } from "lucide-react-native";

import Header from "../../../../components/Header";
import { Skeleton, SkeletonCircle } from "../../../../components/Skeleton";
import AppSwitcherPill from "../../../../features/crm/components/AppSwitcherPill";
import { openDrawer } from "../../../../helpers/navigationRef";
import { canMgr } from "../../../../helpers/permissions";
import { useAppSwitcher } from "../../../../features/crm/context/AppSwitcherContext";
import { CRM_COLORS, CRM_RADIUS, CRM_SHADOW } from "../../../../features/crm/theme/colors";
import useMyCommission from "../../../../features/crmCommission/hooks/useMyCommission";
import useStaffCommission from "../../../../features/crmCommission/hooks/useStaffCommission";
import useStaffCommissionDetail from "../../../../features/crmCommission/hooks/useStaffCommissionDetail";

const TYPE_CONFIG = {
  cif: { label: "Mở CIF", bg: "#EFF3FF", color: CRM_COLORS.accent },
  ekyc: { label: "eKYC", bg: "#D1FAE5", color: CRM_COLORS.success },
  investment: { label: "Đầu tư", bg: "#FFF3EE", color: CRM_COLORS.primaryDark },
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CONFIG[type];
  return (
    <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const formatMoney = (amount) => (!amount ? "0 đ" : amount.toLocaleString("vi-VN") + " đ");
const formatAmountShort = (amount) => {
  if (!amount) return "";
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Tỷ`;
  if (amount >= 1_000_000) return `${Math.round(amount / 1_000_000)} Tr`;
  return amount.toLocaleString("vi-VN") + " đ";
};

const buildHistoryItems = (customerCommissions = [], commissions = []) => {
  const items = [];
  customerCommissions.forEach((c) => {
    if (c.cif_commission?.sale_id) {
      items.push({ key: `cif-${c._id}`, type: "cif", date: c.cif_commission.granted_at, customerName: c.identity?.full_name || null, phone: c.phone_number, detail: "Mở tài khoản", amount: c.cif_commission.amount });
    }
    if (c.ekyc_commission?.sale_id) {
      items.push({ key: `ekyc-${c._id}`, type: "ekyc", date: c.ekyc_commission.granted_at, customerName: c.identity?.full_name || null, phone: c.phone_number, detail: "eKYC thành công", amount: c.ekyc_commission.amount });
    }
  });
  commissions.forEach((item) => {
    const termLabel = item.term_value ? `${item.term_value} ${item.term_type === "month" ? "tháng" : "ngày"}` : null;
    items.push({
      key: `inv-${item._id}`,
      type: "investment",
      date: item.invested_at,
      customerName: item.customer_id?.identity?.full_name || null,
      phone: item.customer_id?.phone_number,
      detail: [item.product_name, formatAmountShort(item.amount), termLabel].filter(Boolean).join(" · "),
      amount: item.commission?.net_amount ?? 0,
    });
  });
  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const HistoryItemSkeleton = () => (
  <View style={styles.historyItem}>
    <View style={styles.historyLeft}>
      <Skeleton width={70} height={18} borderRadius={9} />
      <Skeleton width="60%" height={13} style={{ marginTop: 8 }} />
      <Skeleton width="40%" height={11} style={{ marginTop: 6 }} />
    </View>
    <View style={styles.historyRight}>
      <Skeleton width={70} height={14} />
      <Skeleton width={60} height={11} style={{ marginTop: 6 }} />
    </View>
  </View>
);

const StaffRowSkeleton = () => (
  <View style={styles.staffCard}>
    <View style={styles.staffCardLeft}>
      <SkeletonCircle size={28} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="50%" height={13} />
        <Skeleton width="80%" height={11} />
        <Skeleton width="70%" height={11} />
      </View>
    </View>
  </View>
);

const HistoryList = ({ items, month, year }) =>
  items.length === 0 ? (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={48} color="#CBD5E0" />
      <Text style={styles.emptyText}>Không có hoa hồng trong tháng {month}/{year}</Text>
    </View>
  ) : (
    items.map((item) => (
      <View key={item.key} style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <TypeBadge type={item.type} />
          <Text style={styles.historyCustomer} numberOfLines={1}>{item.customerName || "Chưa eKYC"}</Text>
          <Text style={styles.historyPhone}>{item.phone}</Text>
          {!!item.detail && <Text style={styles.historyDesc} numberOfLines={2}>{item.detail}</Text>}
        </View>
        <View style={styles.historyRight}>
          <Text style={[styles.historyAmount, { color: TYPE_CONFIG[item.type].color }]}>+{formatMoney(item.amount)}</Text>
          <Text style={styles.historyDate}>{item.date ? dayjs(item.date).format("DD/MM/YYYY") : "—"}</Text>
        </View>
      </View>
    ))
  );

export default function IncomeScreen() {
  const user = useSelector((s) => s.auth.user);
  const isManager = canMgr(user, "crm");
  const { appCode } = useAppSwitcher();

  const now = new Date();
  const [activeTab, setActiveTab] = useState("mine");
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [appliedMonth, setAppliedMonth] = useState(now.getMonth() + 1);
  const [appliedYear, setAppliedYear] = useState(now.getFullYear());
  const [tempMonth, setTempMonth] = useState(now.getMonth() + 1);
  const [tempYear, setTempYear] = useState(now.getFullYear());
  const [isBalanceVisible, setBalanceVisible] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const years = [2025, 2026, 2027];

  const mineQuery = useMyCommission(appliedMonth, appliedYear, appCode);
  const staffQuery = useStaffCommission(appliedMonth, appliedYear, activeTab === "staff" && isManager);
  const saleDetailQuery = useStaffCommissionDetail(selectedSale?.sale_id, appliedMonth, appliedYear);

  const summary = mineQuery.data?.summary;
  const ccSummary = mineQuery.data?.customer_commission_summary;
  const totalNet = (summary?.total_net ?? 0) + (ccSummary?.total_amount ?? 0);
  const historyItems = useMemo(
    () => buildHistoryItems(mineQuery.data?.customer_commissions, mineQuery.data?.data),
    [mineQuery.data],
  );

  const staffRows = staffQuery.data ?? [];
  const detailHistoryItems = useMemo(
    () => buildHistoryItems(saleDetailQuery.data?.customer_commissions, saleDetailQuery.data?.data),
    [saleDetailQuery.data],
  );
  const detailTotalNet = (saleDetailQuery.data?.summary?.total_net ?? 0) + (saleDetailQuery.data?.customer_commission_summary?.total_amount ?? 0);

  const openFilter = () => {
    setTempMonth(appliedMonth);
    setTempYear(appliedYear);
    setFilterVisible(true);
  };

  const handleApplyFilter = () => {
    setAppliedMonth(tempMonth);
    setAppliedYear(tempYear);
    setFilterVisible(false);
  };

  const mask = (text) => (isBalanceVisible ? text : "••••••");

  const renderStaffRow = ({ item, index }) => {
    const saleName = item.sale?.full_name || item.sale?.ma_nv || "—";
    return (
      <TouchableOpacity style={styles.staffCard} activeOpacity={0.75} onPress={() => setSelectedSale(item)}>
        <View style={styles.staffCardLeft}>
          <View style={styles.staffRankBadge}>
            <Text style={styles.staffRankText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.staffName}>{saleName}</Text>
            <View style={styles.staffMiniRow}>
              <Text style={styles.staffMiniLabel}>CIF</Text>
              <Text style={styles.staffMiniVal}>{item.cif_count ?? 0} ({formatAmountShort(item.cif_amount)})</Text>
              <Text style={[styles.staffMiniLabel, { marginLeft: 8 }]}>eKYC</Text>
              <Text style={styles.staffMiniVal}>{item.ekyc_count ?? 0} ({formatAmountShort(item.ekyc_amount)})</Text>
            </View>
            <View style={styles.staffMiniRow}>
              <Text style={styles.staffMiniLabel}>Đầu tư</Text>
              <Text style={styles.staffMiniVal}>{item.inv_count ?? 0} ({formatAmountShort(item.inv_net)})</Text>
            </View>
          </View>
        </View>
        <View style={styles.staffCardRight}>
          <Text style={styles.staffTotal}>{formatAmountShort(item.total_net)}</Text>
          <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <Header centerContent={<AppSwitcherPill />} LeftIcon={Menu} onLeftPress={() => openDrawer()} />

      {isManager && (
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab === "mine" && styles.tabActive]} onPress={() => setActiveTab("mine")}>
            <Text style={[styles.tabLabel, activeTab === "mine" && styles.tabLabelActive]}>Của tôi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "staff" && styles.tabActive]} onPress={() => setActiveTab("staff")}>
            <Text style={[styles.tabLabel, activeTab === "staff" && styles.tabLabelActive]}>Nhân viên</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "mine" && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={mineQuery.isRefetching} onRefresh={() => mineQuery.refetch()} colors={[CRM_COLORS.primary]} tintColor={CRM_COLORS.primary} />}
        >
          <View style={[styles.heroCard, CRM_SHADOW.cta]}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Tổng hoa hồng</Text>
              <TouchableOpacity onPress={() => setBalanceVisible((v) => !v)} hitSlop={8}>
                <Ionicons name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} size={18} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
            </View>

            {mineQuery.isLoading ? (
              <Skeleton width={160} height={28} style={{ marginTop: 8, backgroundColor: "rgba(255,255,255,0.35)" }} />
            ) : (
              <Text style={styles.heroAmount}>{mask(formatMoney(totalNet))}</Text>
            )}

            <TouchableOpacity style={styles.periodBtn} onPress={openFilter} activeOpacity={0.85}>
              <Ionicons name="calendar-outline" size={14} color="#fff" />
              <Text style={styles.periodBtnText}>Th. {appliedMonth}/{appliedYear}</Text>
            </TouchableOpacity>
          </View>

          {!mineQuery.isLoading && (
            <View style={styles.ccRow}>
              <View style={[styles.ccCard, { borderLeftColor: CRM_COLORS.accent }]}>
                <Ionicons name="person-add-outline" size={20} color={CRM_COLORS.accent} />
                <Text style={styles.ccLabel}>HH mở CIF</Text>
                <Text style={[styles.ccAmount, { color: CRM_COLORS.accent }]}>{mask(formatMoney(ccSummary?.cif_amount ?? 0))}</Text>
                <Text style={styles.ccCount}>{ccSummary?.cif_count ?? 0} khách</Text>
              </View>
              <View style={[styles.ccCard, { borderLeftColor: CRM_COLORS.success }]}>
                <Ionicons name="finger-print-outline" size={20} color={CRM_COLORS.success} />
                <Text style={styles.ccLabel}>HH eKYC</Text>
                <Text style={[styles.ccAmount, { color: CRM_COLORS.success }]}>{mask(formatMoney(ccSummary?.ekyc_amount ?? 0))}</Text>
                <Text style={styles.ccCount}>{ccSummary?.ekyc_count ?? 0} khách</Text>
              </View>
            </View>
          )}

          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>Lịch sử cộng hoa hồng</Text>
            {mineQuery.isLoading ? (
              <>
                <HistoryItemSkeleton />
                <HistoryItemSkeleton />
                <HistoryItemSkeleton />
              </>
            ) : (
              <HistoryList items={historyItems} month={appliedMonth} year={appliedYear} />
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === "staff" && (
        <FlatList
          data={staffRows}
          keyExtractor={(item) => item.sale_id}
          renderItem={renderStaffRow}
          contentContainerStyle={styles.staffList}
          refreshControl={<RefreshControl refreshing={staffQuery.isRefetching} onRefresh={() => staffQuery.refetch()} colors={[CRM_COLORS.primary]} tintColor={CRM_COLORS.primary} />}
          ListHeaderComponent={
            <View style={styles.staffHeader}>
              <Text style={styles.staffHeaderText}>Tháng {appliedMonth}/{appliedYear} · {staffRows.length} nhân viên</Text>
            </View>
          }
          ListEmptyComponent={
            staffQuery.isLoading ? (
              <View>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StaffRowSkeleton key={i} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={48} color="#CBD5E0" />
                <Text style={styles.emptyText}>Không có dữ liệu hoa hồng</Text>
              </View>
            )
          }
        />
      )}

      <Modal visible={!!selectedSale} animationType="slide" transparent onRequestClose={() => setSelectedSale(null)}>
        <View style={styles.detailModalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedSale(null)} />
          <View style={styles.detailSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedSale?.sale?.full_name || selectedSale?.sale?.ma_nv || "—"}</Text>
              <TouchableOpacity onPress={() => setSelectedSale(null)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {saleDetailQuery.isLoading ? (
              <View style={{ marginTop: 16 }}>
                <View style={styles.detailWalletCard}>
                  <Skeleton width="70%" height={12} style={{ backgroundColor: "rgba(255,255,255,0.35)" }} />
                  <Skeleton width={140} height={26} style={{ marginTop: 10, backgroundColor: "rgba(255,255,255,0.35)" }} />
                </View>
                <View style={styles.ccRow}>
                  <View style={[styles.ccCard, { borderLeftColor: "#E5E7EB" }]}>
                    <Skeleton width={18} height={18} borderRadius={4} />
                    <Skeleton width="80%" height={11} style={{ marginTop: 8 }} />
                    <Skeleton width="60%" height={14} style={{ marginTop: 6 }} />
                  </View>
                  <View style={[styles.ccCard, { borderLeftColor: "#E5E7EB" }]}>
                    <Skeleton width={18} height={18} borderRadius={4} />
                    <Skeleton width="80%" height={11} style={{ marginTop: 8 }} />
                    <Skeleton width="60%" height={14} style={{ marginTop: 6 }} />
                  </View>
                </View>
                <HistoryItemSkeleton />
                <HistoryItemSkeleton />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.detailWalletCard}>
                  <Text style={styles.heroLabel}>Tổng hoa hồng — Tháng {appliedMonth}/{appliedYear}</Text>
                  <Text style={styles.heroAmount}>{formatMoney(detailTotalNet)}</Text>
                </View>

                <View style={styles.ccRow}>
                  <View style={[styles.ccCard, { borderLeftColor: CRM_COLORS.accent }]}>
                    <Ionicons name="person-add-outline" size={18} color={CRM_COLORS.accent} />
                    <Text style={styles.ccLabel}>HH mở CIF</Text>
                    <Text style={[styles.ccAmount, { color: CRM_COLORS.accent, fontSize: 14 }]}>{formatMoney(saleDetailQuery.data?.customer_commission_summary?.cif_amount ?? 0)}</Text>
                    <Text style={styles.ccCount}>{saleDetailQuery.data?.customer_commission_summary?.cif_count ?? 0} khách</Text>
                  </View>
                  <View style={[styles.ccCard, { borderLeftColor: CRM_COLORS.success }]}>
                    <Ionicons name="finger-print-outline" size={18} color={CRM_COLORS.success} />
                    <Text style={styles.ccLabel}>HH eKYC</Text>
                    <Text style={[styles.ccAmount, { color: CRM_COLORS.success, fontSize: 14 }]}>{formatMoney(saleDetailQuery.data?.customer_commission_summary?.ekyc_amount ?? 0)}</Text>
                    <Text style={styles.ccCount}>{saleDetailQuery.data?.customer_commission_summary?.ekyc_count ?? 0} khách</Text>
                  </View>
                </View>

                <View style={[styles.historyContainer, { marginTop: 0 }]}>
                  <Text style={styles.sectionTitle}>Lịch sử cộng hoa hồng</Text>
                  <HistoryList items={detailHistoryItems} month={appliedMonth} year={appliedYear} />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={isFilterVisible} onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterVisible(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Chọn kỳ đối soát</Text>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Năm</Text>
              <View style={styles.grid}>
                {years.map((year) => (
                  <TouchableOpacity key={`year-${year}`} onPress={() => setTempYear(year)} style={[styles.filterBadge, styles.filterBadgeYear, tempYear === year && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, tempYear === year && styles.filterBadgeTextActive]}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Tháng</Text>
              <View style={styles.grid}>
                {months.map((month) => (
                  <TouchableOpacity key={`month-${month}`} onPress={() => setTempMonth(month)} style={[styles.filterBadge, styles.filterBadgeMonth, tempMonth === month && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, tempMonth === month && styles.filterBadgeTextActive]}>Th. {month}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setFilterVisible(false)}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnApply} onPress={handleApplyFilter}>
                <Text style={styles.btnApplyText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CRM_COLORS.background },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: CRM_COLORS.primary },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  tabLabelActive: { color: CRM_COLORS.primary },

  heroCard: { marginHorizontal: 16, marginTop: 16, padding: 22, borderRadius: CRM_RADIUS.xl, backgroundColor: CRM_COLORS.primary, alignItems: "center" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  heroAmount: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 },
  periodBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: CRM_RADIUS.pill },
  periodBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  ccRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  ccCard: { flex: 1, backgroundColor: "#fff", borderRadius: CRM_RADIUS.sm, padding: 14, borderLeftWidth: 3, ...CRM_SHADOW.card },
  ccLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600", marginTop: 6, marginBottom: 2 },
  ccAmount: { fontSize: 16, fontWeight: "800" },
  ccCount: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  historyContainer: { marginTop: 16, backgroundColor: "#fff", borderRadius: CRM_RADIUS.xl, padding: 20, marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 16 },
  historyItem: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  historyLeft: { flex: 1, marginRight: 8 },
  historyCustomer: { fontSize: 14, fontWeight: "600", color: "#111827", marginTop: 6, marginBottom: 2 },
  historyPhone: { fontSize: 12, color: "#9CA3AF", marginBottom: 2 },
  historyDesc: { fontSize: 12, color: "#6B7280" },
  historyRight: { alignItems: "flex-end", flexShrink: 0 },
  historyAmount: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  historyDate: { fontSize: 12, color: "#9CA3AF" },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#9CA3AF", marginTop: 12, textAlign: "center" },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },

  staffList: { padding: 16, paddingBottom: 80, gap: 10 },
  staffHeader: { paddingBottom: 8 },
  staffHeaderText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  staffCard: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.md, padding: 14, flexDirection: "row", alignItems: "center", ...CRM_SHADOW.card },
  staffCardLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  staffCardRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  staffRankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#EFF3FF", alignItems: "center", justifyContent: "center" },
  staffRankText: { fontSize: 12, fontWeight: "800", color: CRM_COLORS.accent },
  staffName: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 4 },
  staffMiniRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  staffMiniLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  staffMiniVal: { fontSize: 11, color: "#374151" },
  staffTotal: { fontSize: 15, fontWeight: "800", color: CRM_COLORS.primary },

  detailModalOverlay: { flex: 1, justifyContent: "flex-end" },
  detailSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 0, maxHeight: "90%" },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  detailWalletCard: { backgroundColor: CRM_COLORS.primary, padding: 20, borderRadius: CRM_RADIUS.lg, alignItems: "center", marginBottom: 12 },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  bottomSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 5, backgroundColor: "#CBD5E0", borderRadius: 3, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 20, textAlign: "center" },
  filterSection: { marginBottom: 20 },
  filterLabel: { fontSize: 15, fontWeight: "600", color: "#4A5568", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  filterBadge: { paddingVertical: 10, margin: "1%", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", backgroundColor: "#F7FAFC" },
  filterBadgeYear: { width: "31%" },
  filterBadgeMonth: { width: "23%" },
  filterBadgeActive: { backgroundColor: CRM_COLORS.primary, borderColor: CRM_COLORS.primary },
  filterBadgeText: { fontSize: 14, color: "#4A5568", fontWeight: "500" },
  filterBadgeTextActive: { color: "#fff", fontWeight: "700" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  btnCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#EDF2F7", marginRight: 8, alignItems: "center" },
  btnCancelText: { color: "#4A5568", fontSize: 16, fontWeight: "600" },
  btnApply: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: CRM_COLORS.primary, marginLeft: 8, alignItems: "center" },
  btnApplyText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
