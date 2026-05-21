import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import ViewShot from "react-native-view-shot";
import Share from "react-native-share";

import { openDrawer } from "../../helpers/navigationRef";
import api from "../../api/axiosInstance";
import Header from "../../components/Header";
import { getPermissions } from "../../helpers/permissions";
import SalesSummaryChart from "../../components/crm/dashboard/SalesSummaryChart";

dayjs.locale("vi");

const { width } = Dimensions.get("window");

const getGreeting = (fullName, sex) => {
  const h = new Date().getHours();
  const time = h < 12 ? "buổi sáng" : h < 18 ? "buổi chiều" : "buổi tối";
  const pronoun = sex === 1 ? "anh" : sex === 2 ? "chị" : "bạn";
  const name = fullName?.trim().split(/\s+/).pop() ?? "";
  return `Chào ${time}, ${pronoun} ${name}!`;
};

const formatMoney = (amount) => {
  if (!amount) return "0 đ";
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Tỷ đ`;
  if (amount >= 1_000_000) return `${Math.round(amount / 1_000_000)} Tr đ`;
  return amount.toLocaleString("vi-VN") + " đ";
};

const RANK_COLORS = ["#F59E0B", "#94A3B8", "#B45309"];

export default function DashboardCRMScreen() {
  const user = useSelector((s) => s.auth.user);
  const perms = getPermissions(user);
  const isManager = perms.showCustomerAll;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [dataQR, setDataQR] = useState(null);
  const [myCustomers, setMyCustomers] = useState({ total: 0, recent: [] });
  const [allCustomerTotal, setAllCustomerTotal] = useState(0);
  const [commission, setCommission] = useState({ total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const viewShotRef = useRef(null);

  // Cảnh báo đáo hạn
  const [expiring, setExpiring] = useState(null);
  const [expiringDays, setExpiringDays] = useState(30);
  const [loadingExpiring, setLoadingExpiring] = useState(false);

  // Xếp hạng sale
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbPeriod, setLbPeriod] = useState("month");
  const [loadingLb, setLoadingLb] = useState(false);

  // Tỷ lệ chuyển đổi
  const [conversion, setConversion] = useState(null);
  const [loadingConversion, setLoadingConversion] = useState(true);

  const fetchAll = useCallback(async () => {
    // Fetch dữ liệu chính — nếu lỗi thì dashboard trống hoàn toàn (auth / network)
    try {
      const [qrRes, myRes, commRes] = await Promise.all([
        api.get("/user/getQRSale", { requiresAuth: true }),
        api.get("/customer/my-customers", { requiresAuth: true, params: { page: 1, limit: 5 } }),
        api.get(`/investments/my-commission?month=${month}&year=${year}`, { requiresAuth: true }),
      ]);

      setDataQR(qrRes.data);
      setMyCustomers({
        total: myRes.data?.pagination?.total ?? myRes.pagination?.total ?? 0,
        recent: myRes.data?.data ?? myRes.data ?? [],
      });
      setCommission({
        total: commRes.data?.summary?.total_net ?? 0,
        count: commRes.data?.data?.length ?? 0,
      });

      if (isManager) {
        const allRes = await api.get("/customer/all", { requiresAuth: true, params: { page: 1, limit: 1 } });
        setAllCustomerTotal(allRes.data?.pagination?.total ?? allRes.pagination?.total ?? 0);
      }
    } catch (err) {
      console.log("DashboardCRM fetchAll error:", err.message);
    }

    // Fetch 3 section mới độc lập — lỗi không ảnh hưởng dữ liệu chính
    setLoadingConversion(true);
    try {
      const [expiringRes, lbRes, convRes] = await Promise.all([
        api.get("/investments/expiring", { requiresAuth: true, params: { days: 30 } }),
        api.get("/investments/leaderboard", { requiresAuth: true, params: { period: "month" } }),
        api.get("/investments/conversion", { requiresAuth: true }),
      ]);
      setExpiring(expiringRes.data);
      setLeaderboard(lbRes.data?.leaderboard ?? []);
      setConversion(convRes.data);
    } catch (err) {
      console.log("DashboardCRM extra fetch error:", err.message);
    } finally {
      setLoadingConversion(false);
    }
  }, [isManager, month, year]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    };
    load();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const handleExpiringDays = useCallback(async (days) => {
    setExpiringDays(days);
    setLoadingExpiring(true);
    try {
      const res = await api.get("/investments/expiring", { requiresAuth: true, params: { days } });
      setExpiring(res.data);
    } catch (err) {
      console.log("expiring error:", err.message);
    } finally {
      setLoadingExpiring(false);
    }
  }, []);

  const handleLbPeriod = useCallback(async (period) => {
    setLbPeriod(period);
    setLoadingLb(true);
    try {
      const res = await api.get("/investments/leaderboard", { requiresAuth: true, params: { period } });
      setLeaderboard(res.data?.leaderboard ?? []);
    } catch (err) {
      console.log("leaderboard error:", err.message);
    } finally {
      setLoadingLb(false);
    }
  }, []);

  const handleShare = async () => {
    try {
      if (!dataQR) return;
      const filePath = await viewShotRef?.current?.capture?.();
      if (!filePath) return;
      await Share.open({
        title: "Chia sẻ mã QR giới thiệu",
        message: "Quét mã này để mở tài khoản và nhận ưu đãi!",
        url: `file://${filePath}`,
        type: "image/png",
      });
    } catch (err) {
      if (!err?.message?.includes("cancel")) console.log("Share error:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0055ba" />
      </View>
    );
  }

  const expiringList = expiring?.investments ?? [];
  const maxLbAmount = leaderboard[0]?.total_amount || 1;

  return (
    <View style={styles.container}>
      <Header title="CRM" leftIconName="menu" onLeftPress={() => openDrawer()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0055ba"]} tintColor="#0055ba" />}
      >
        {/* Greeting */}
        <View style={styles.greetingBox}>
          <Text style={styles.greetingTitle}>{getGreeting(user?.full_name, user?.sex)}</Text>
          <Text style={styles.greetingDate}>
            {dayjs().format("dddd, DD/MM/YYYY").replace(/^\w/, (c) => c.toUpperCase())} · {isManager ? "Quản lý CRM" : "Nhân viên CRM"}
          </Text>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#EFF6FF" }]}>
            <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="person-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{myCustomers.total}</Text>
            <Text style={styles.statLabel}>KH của tôi</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#ECFDF5" }]}>
            <View style={[styles.statIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="cash-outline" size={20} color="#059669" />
            </View>
            <Text style={[styles.statNumber, { fontSize: 16 }]}>{formatMoney(commission.total)}</Text>
            <Text style={styles.statLabel}>Hoa hồng T{month}</Text>
          </View>

          {isManager && (
            <View style={[styles.statCard, { backgroundColor: "#F5F3FF" }]}>
              <View style={[styles.statIcon, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="people-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.statNumber}>{allCustomerTotal}</Text>
              <Text style={styles.statLabel}>Tổng KH</Text>
            </View>
          )}
        </View>

        {/* Biểu đồ doanh số */}
        <SalesSummaryChart isAdmin={perms.isAdminRole} isMgr={isManager} />

        {/* ── Cảnh báo đáo hạn ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Cảnh báo đáo hạn</Text>
            {(expiring?.total ?? 0) > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{expiring.total}</Text>
              </View>
            )}
            <View style={styles.toggleRow}>
              {[7, 14, 30].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => handleExpiringDays(d)}
                  style={[styles.toggleBtn, expiringDays === d && styles.toggleBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleBtnText, expiringDays === d && styles.toggleBtnTextActive]}>
                    {d}n
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loadingExpiring ? (
            <ActivityIndicator size="small" color="#0055ba" style={{ marginVertical: 16 }} />
          ) : expiringList.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không có hợp đồng đáo hạn trong {expiringDays} ngày tới</Text>
            </View>
          ) : (
            expiringList.map((inv) => {
              const urgency = {
                urgent: { bg: "#FEE2E2", color: "#DC2626" },
                warning: { bg: "#FEF9C3", color: "#CA8A04" },
                normal: { bg: "#DCFCE7", color: "#16A34A" },
              }[inv.urgency] ?? { bg: "#F3F4F6", color: "#6B7280" };

              return (
                <View key={String(inv._id)} style={styles.expiringRow}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {inv.customer_name?.charAt(0).toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName} numberOfLines={1}>{inv.customer_name}</Text>
                    <Text style={styles.customerPhone} numberOfLines={1}>{inv.product_name}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={styles.expiringAmount}>{formatMoney(inv.amount)}</Text>
                    <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                      <Text style={[styles.urgencyText, { color: urgency.color }]}>
                        {inv.days_left} ngày
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Xếp hạng sale ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Xếp hạng sale</Text>
            <View style={styles.toggleRow}>
              {[{ v: "week", l: "Tuần" }, { v: "month", l: "Tháng" }].map((opt) => (
                <TouchableOpacity
                  key={opt.v}
                  onPress={() => handleLbPeriod(opt.v)}
                  style={[styles.toggleBtn, lbPeriod === opt.v && styles.toggleBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleBtnText, lbPeriod === opt.v && styles.toggleBtnTextActive]}>
                    {opt.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loadingLb ? (
            <ActivityIndicator size="small" color="#0055ba" style={{ marginVertical: 16 }} />
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có dữ liệu xếp hạng</Text>
            </View>
          ) : (
            leaderboard.map((row, idx) => {
              const pct = Math.round((row.total_amount / maxLbAmount) * 100);
              const rankColor = RANK_COLORS[idx] ?? "#0055ba";
              return (
                <View key={String(row._id)} style={styles.lbRow}>
                  <Text style={[styles.lbRank, { color: RANK_COLORS[idx] ?? "#9CA3AF", fontSize: idx < 3 ? 17 : 14 }]}>
                    {idx + 1}
                  </Text>
                  <View style={[styles.lbAvatar, { backgroundColor: "#DBEAFE" }]}>
                    <Text style={[styles.lbAvatarText, { color: "#2563EB" }]}>
                      {row.sale_name?.charAt(0).toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.lbRowTop}>
                      <Text style={styles.lbName} numberOfLines={1}>{row.sale_name}</Text>
                      <Text style={styles.lbAmount}>{formatMoney(row.total_amount)}</Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: rankColor }]} />
                    </View>
                  </View>
                  <View style={styles.lbBadge}>
                    <Text style={styles.lbBadgeText}>{row.count} GD</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Tỷ lệ chuyển đổi ── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: 4 }]}>
            <Ionicons name="bar-chart-outline" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Tỷ lệ chuyển đổi</Text>
          </View>
          <Text style={styles.sectionNote}>
            Đo lường hiệu quả chuyển đổi khách hàng qua 3 giai đoạn:{" "}
            <Text style={styles.sectionNoteHighlight}>Đăng ký → KYC → Đầu tư</Text>.
            Tỷ lệ cao cho thấy khách được chăm sóc tốt đến bước hoàn thành giao dịch.
          </Text>

          {loadingConversion ? (
            <ActivityIndicator size="small" color="#0055ba" style={{ marginVertical: 16 }} />
          ) : !conversion ? (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có dữ liệu chuyển đổi</Text>
            </View>
          ) : conversion.mode === "personal" ? (
            <View style={styles.funnelRow}>
              {conversion.funnel.map((step, idx) => {
                const funnelColors = [
                  { bg: "#EFF6FF", text: "#2563EB", label: "#1D4ED8" },
                  { bg: "#F0FDF4", text: "#16A34A", label: "#15803D" },
                  { bg: "#FFF7ED", text: "#EA580C", label: "#C2410C" },
                ];
                const c = funnelColors[idx] ?? funnelColors[2];
                const prevCount = idx > 0 ? conversion.funnel[idx - 1]?.count : null;
                const pct = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : null;
                return (
                  <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={[styles.funnelCard, { backgroundColor: c.bg }]}>
                      <Text style={[styles.funnelCount, { color: c.text }]}>{step.count}</Text>
                      <Text style={[styles.funnelLabel, { color: c.label }]}>{step.label}</Text>
                      {pct !== null && (
                        <Text style={styles.funnelPct}>{pct}%</Text>
                      )}
                    </View>
                    {idx < conversion.funnel.length - 1 && (
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginHorizontal: 2 }} />
                    )}
                  </View>
                );
              })}
            </View>
          ) : conversion.mode === "manager" ? (
            <>
              <View style={styles.convTableHeader}>
                <Text style={[styles.convHeaderCell, { flex: 2 }]}>Sale</Text>
                <Text style={styles.convHeaderCell}>Đăng ký</Text>
                <Text style={styles.convHeaderCell}>KYC</Text>
                <Text style={styles.convHeaderCell}>Đầu tư</Text>
                <Text style={styles.convHeaderCell}>Tỷ lệ</Text>
              </View>
              {conversion.rows.map((row) => {
                const kycRate = row.total > 0 ? Math.round((row.kyc_done / row.total) * 100) : 0;
                const invRate = row.kyc_done > 0 ? Math.round((row.invested / row.kyc_done) * 100) : 0;
                return (
                  <View key={String(row._id)} style={styles.convTableRow}>
                    <View style={[styles.convCell, { flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }]}>
                      <View style={styles.miniAvatar}>
                        <Text style={styles.miniAvatarText}>{row.sale_name?.charAt(0).toUpperCase() ?? "?"}</Text>
                      </View>
                      <Text style={styles.convCellText} numberOfLines={1}>{row.sale_name}</Text>
                    </View>
                    <View style={styles.convCell}>
                      <Text style={styles.convCellNum}>{row.total}</Text>
                    </View>
                    <View style={styles.convCell}>
                      <Text style={styles.convCellNum}>{row.kyc_done}</Text>
                    </View>
                    <View style={styles.convCell}>
                      <Text style={styles.convCellNum}>{row.invested}</Text>
                    </View>
                    <View style={styles.convCell}>
                      <Text style={[styles.convCellPct, { color: invRate >= 50 ? "#16A34A" : "#EA580C" }]}>
                        {invRate}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          ) : null}
        </View>

        {/* QR Section */}
        <View style={styles.qrCard}>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.qrInner}>
              <Text style={styles.qrTitle}>Mã QR Giới Thiệu</Text>
              <Text style={styles.qrCode}>{user?.phone_number}-{dataQR?.ma_nv}</Text>
              <Text style={styles.qrSubTitle}>Khách hàng quét mã để mở tài khoản</Text>
              <View style={styles.qrWrapper}>
                {dataQR?.landing_url ? (
                  <QRCode
                    value={dataQR.landing_url}
                    size={width * 0.52}
                    color="#000"
                    backgroundColor="#fff"
                  />
                ) : (
                  <View style={[styles.qrWrapper, { alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ color: "#999", fontSize: 13 }}>Chưa có mã QR</Text>
                  </View>
                )}
              </View>
            </View>
          </ViewShot>

          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={18} color="#0055ba" />
            <Text style={styles.shareBtnText}>Chia sẻ mã giới thiệu</Text>
          </TouchableOpacity>
        </View>

        {/* Khách hàng gần đây */}
        {myCustomers.recent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khách hàng gần đây</Text>
            {myCustomers.recent.map((c) => {
              const name = c?.identity?.full_name ?? c?.phone_number ?? "Không xác định";
              const phone = c?.phone_number ?? "—";
              return (
                <View key={c._id} style={styles.customerRow}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.customerPhone}>{phone}</Text>
                  </View>
                  <Text style={styles.customerDate}>
                    {c.createdAt ? dayjs(c.createdAt).format("DD/MM") : ""}
                  </Text>
                </View>
              );
            })}
            {myCustomers.total > 5 && (
              <Text style={styles.viewAllText}>+{myCustomers.total - 5} khách hàng khác</Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  greetingBox: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  greetingTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  greetingDate: { fontSize: 13, color: "#6B7280", marginTop: 2, textTransform: "capitalize" },

  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  statNumber: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2, textAlign: "center" },

  // ── Section card ──
  section: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: "#fff",
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  countBadge: { backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  toggleRow: { flexDirection: "row", gap: 4 },
  toggleBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  toggleBtnActive: { backgroundColor: "#0055ba" },
  toggleBtnText: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
  toggleBtnTextActive: { color: "#fff" },

  emptyState: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  sectionNote: { fontSize: 12, color: "#6B7280", lineHeight: 17, marginBottom: 14, paddingHorizontal: 0 },
  sectionNoteHighlight: { fontWeight: "700", color: "#374151" },

  // ── Cảnh báo đáo hạn ──
  expiringRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  urgencyBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  urgencyText: { fontSize: 11, fontWeight: "700" },
  expiringAmount: { fontSize: 13, fontWeight: "700", color: "#111827" },

  // ── Xếp hạng sale ──
  lbRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12,
  },
  lbRank: { width: 22, textAlign: "center", fontWeight: "800" },
  lbAvatar: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  lbAvatarText: { fontSize: 14, fontWeight: "700" },
  lbRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lbName: { fontSize: 13, fontWeight: "600", color: "#111827", flex: 1 },
  lbAmount: { fontSize: 13, fontWeight: "700", color: "#111827", marginLeft: 4 },
  progressBg: { height: 5, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  progressBar: { height: 5, borderRadius: 3 },
  lbBadge: { backgroundColor: "#F3F4F6", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  lbBadgeText: { fontSize: 10, fontWeight: "600", color: "#6B7280" },

  // ── Tỷ lệ chuyển đổi ──
  funnelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 2 },
  funnelCard: { borderRadius: 12, padding: 14, alignItems: "center", minWidth: 88 },
  funnelCount: { fontSize: 24, fontWeight: "800" },
  funnelLabel: { fontSize: 11, fontWeight: "600", marginTop: 2, textAlign: "center" },
  funnelPct: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },

  convTableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingBottom: 8, marginBottom: 4 },
  convHeaderCell: { flex: 1, fontSize: 11, fontWeight: "700", color: "#6B7280", textAlign: "center" },
  convTableRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F9FAFB", alignItems: "center" },
  convCell: { flex: 1, alignItems: "center" },
  convCellText: { fontSize: 12, fontWeight: "600", color: "#111827" },
  convCellNum: { fontSize: 13, fontWeight: "600", color: "#374151" },
  convCellPct: { fontSize: 12, fontWeight: "700" },
  miniAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center" },
  miniAvatarText: { fontSize: 10, fontWeight: "700", color: "#2563EB" },

  // ── QR ──
  qrCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 20, paddingBottom: 20,
    alignItems: "center", elevation: 3,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  qrInner: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, width: "100%" },
  qrTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  qrCode: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  qrSubTitle: { fontSize: 13, color: "#9CA3AF", marginTop: 4, marginBottom: 18 },
  qrWrapper: { padding: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 16 },
  shareBtn: {
    flexDirection: "row", alignItems: "center", marginTop: 18,
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: 25,
    borderWidth: 1.5, borderColor: "#0055ba", gap: 8,
  },
  shareBtnText: { color: "#0055ba", fontWeight: "700", fontSize: 14 },

  // ── Khách hàng gần đây ──
  customerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", gap: 12 },
  customerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center" },
  customerAvatarText: { fontSize: 15, fontWeight: "700", color: "#2563EB" },
  customerName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  customerPhone: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  customerDate: { fontSize: 12, color: "#9CA3AF" },
  viewAllText: { textAlign: "center", marginTop: 12, fontSize: 13, color: "#2563EB", fontWeight: "600" },
});
