import {
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useMemo, useRef, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useSelector } from "react-redux";
import { router } from "expo-router";
import ViewShot from "react-native-view-shot";
import Share from "react-native-share";
import * as MediaLibrary from "expo-media-library";
import Toast from "react-native-toast-message";
import {
  Menu,
  QrCode,
  X,
  Copy,
  Check,
  Download,
  Share2,
  PhoneCall,
  UserCheck,
  Users,
  TrendingUp,
  PieChart,
  Briefcase,
  Building2,
} from "lucide-react-native";

import { openDrawer } from "../../../../helpers/navigationRef";
import { canMgr } from "../../../../helpers/permissions";
import Header from "../../../../components/Header";
import { Skeleton } from "../../../../components/Skeleton";
import AppSwitcherPill from "../../../../features/crm/components/AppSwitcherPill";
import { CRM_COLORS, CRM_RADIUS } from "../../../../features/crm/theme/colors";
import { useAppSwitcher } from "../../../../features/crm/context/AppSwitcherContext";
import { useMyPermissions, CRM_INVESTMENT_PERMISSIONS, CRM_AGENT_PERMISSIONS } from "../../../../features/permission";
import useQrSale from "../../../../features/crmDashboard/hooks/useQrSale";
import useMyCustomersSummary from "../../../../features/crmCustomer/hooks/useMyCustomersSummary";
import useAllCustomersTotal from "../../../../features/crmCustomer/hooks/useAllCustomersTotal";
import useNewCustomersToday from "../../../../features/crmCustomer/hooks/useNewCustomersToday";
import useMyCommission from "../../../../features/crmCommission/hooks/useMyCommission";
import useConversionFunnel from "../../../../features/crmDashboard/hooks/useConversionFunnel";

const { width } = Dimensions.get("window");

const formatMoney = (amount) => {
  if (!amount) return "0";
  return amount.toLocaleString("vi-VN");
};

const SPARKLINE_HEIGHTS = [35, 45, 30, 60, 50, 75, 85, 95];

const QUICK_ACTIONS = [
  { key: "customers", label: "Khách hàng", icon: Users, bg: "#FFF3EE", color: CRM_COLORS.primary, borderColor: "#FFE3D5", route: "/crm/customers" },
  { key: "investments", label: "Quản lý Đầu tư", icon: Briefcase, bg: "#F5F0FF", color: "#7C3AED", borderColor: "#EBE0FF", route: "/crm/investments", permissionAny: CRM_INVESTMENT_PERMISSIONS },
  { key: "agency", label: "Đại lý", icon: Building2, bg: "#ECFDF5", color: "#059669", borderColor: "#D1FAE5", route: "/crm/agency", permissionAny: CRM_AGENT_PERMISSIONS },
  { key: "lead", label: "Nhận lead", icon: UserCheck, bg: "#EFF3FF", color: CRM_COLORS.accent, borderColor: "#DCE6FF", route: "/crm/lead-request" },
];

const computeConversion = (conversion) => {
  if (!conversion) return null;
  if (conversion.mode === "personal") {
    const steps = conversion.funnel ?? [];
    const first = steps[0]?.count ?? 0;
    const last = steps[steps.length - 1]?.count ?? 0;
    if (!first) return null;
    return Math.round((last / first) * 100);
  }
  if (conversion.mode === "manager") {
    const rows = conversion.rows ?? [];
    const totalRegistered = rows.reduce((sum, r) => sum + (r.total ?? 0), 0);
    const totalInvested = rows.reduce((sum, r) => sum + (r.invested ?? 0), 0);
    if (!totalRegistered) return null;
    return Math.round((totalInvested / totalRegistered) * 100);
  }
  return null;
};

const conversionTier = (rate) => {
  if (rate === null) return { label: "Chưa có dữ liệu", color: "#6B7280", bg: "#F3F4F6" };
  if (rate >= 50) return { label: "Mức độ Tốt", color: "#10B981", bg: "rgba(16,185,129,0.1)" };
  if (rate >= 25) return { label: "Mức độ Khá", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
  return { label: "Cần cải thiện", color: "#EF4444", bg: "rgba(239,68,68,0.1)" };
};

export default function HomeScreen() {
  const user = useSelector((s) => s.auth.user);
  const isManager = canMgr(user, "crm");
  const { appCode } = useAppSwitcher();
  const { permissions, canAny } = useMyPermissions();

  const visibleQuickActions = useMemo(
    () => QUICK_ACTIONS.filter((action) => !action.permissionAny || canAny(action.permissionAny)),
    [permissions]
  );

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const viewShotRef = useRef(null);

  const qrQuery = useQrSale(appCode);
  const myCustomersQuery = useMyCustomersSummary(5, appCode);
  const allCustomersQuery = useAllCustomersTotal(isManager, appCode);
  const newCustomersTodayQuery = useNewCustomersToday(isManager, appCode);
  const commissionQuery = useMyCommission(month, year, appCode);
  const conversionQuery = useConversionFunnel();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      qrQuery.refetch(),
      myCustomersQuery.refetch(),
      ...(isManager ? [allCustomersQuery.refetch()] : []),
      newCustomersTodayQuery.refetch(),
      commissionQuery.refetch(),
      conversionQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const referralCode = `${user?.phone_number ?? ""}-${qrQuery.data?.ma_nv ?? ""}`;

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.log("Copy code error:", err);
    }
  };

  const handleSaveImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Cần cấp quyền truy cập ảnh để lưu" });
        return;
      }
      const filePath = await viewShotRef?.current?.capture?.();
      if (!filePath) return;
      const fileUri = filePath.startsWith("file://") ? filePath : `file://${filePath}`;
      await MediaLibrary.saveToLibraryAsync(fileUri);
      Toast.show({ type: "success", text1: "Đã lưu ảnh vào thư viện" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Không thể lưu ảnh", text2: err?.message || "Lỗi không xác định" });
    }
  };

  const handleShare = async () => {
    try {
      if (!qrQuery.data) return;
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

  const commissionTotal = commissionQuery.data?.summary?.total_net ?? 0;
  const myCustomersTotal = myCustomersQuery.data?.total ?? 0;
  const allCustomersTotal = allCustomersQuery.data ?? 0;
  const newCustomersToday = newCustomersTodayQuery.data ?? 0;

  const conversionRate = useMemo(() => computeConversion(conversionQuery.data), [conversionQuery.data]);
  const tier = conversionTier(conversionRate);

  const thirdStat = isManager
    ? { icon: Users, bg: "#F5F0FF", iconBg: "#EBE0FF", color: "#7C3AED", value: allCustomersTotal, label: "Tổng\nKhách hàng" }
    : { icon: Users, bg: "#F5F0FF", iconBg: "#EBE0FF", color: "#7C3AED", value: myCustomersTotal, label: "Khách hàng\ncủa tôi" };

  return (
    <View style={styles.container}>
      <Header centerContent={<AppSwitcherPill />} LeftIcon={Menu} onLeftPress={() => openDrawer()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CRM_COLORS.primary]} tintColor={CRM_COLORS.primary} />
        }
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <View style={styles.avatarRing}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{user?.full_name?.charAt(0)?.toUpperCase() ?? "?"}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.userName}>{user?.full_name}</Text>
              <Text style={styles.userCode}>{user?.ma_nv}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => setShowQR(true)} activeOpacity={0.85}>
            <LinearGradient colors={[CRM_COLORS.primary, CRM_COLORS.primaryDark]} style={styles.qrButton}>
              <QrCode size={20} color="#fff" strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#EFF6FF", borderColor: "rgba(191,219,254,0.5)" }]}>
            <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
              <PhoneCall size={18} color="#2563EB" />
            </View>
            {newCustomersTodayQuery.isLoading ? (
              <Skeleton width={28} height={20} />
            ) : (
              <Text style={styles.statNumber}>—</Text>
            )}
            <Text style={styles.statLabel}>Cuộc gọi{"\n"}hôm nay</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#ECFDF5", borderColor: "rgba(167,243,208,0.5)" }]}>
            <View style={[styles.statIcon, { backgroundColor: "#D1FAE5" }]}>
              <UserCheck size={18} color="#059669" />
            </View>
            {newCustomersTodayQuery.isLoading ? (
              <Skeleton width={28} height={20} />
            ) : (
              <Text style={styles.statNumber}>{newCustomersToday}</Text>
            )}
            <Text style={styles.statLabel}>Khách hàng{"\n"}mới</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: thirdStat.bg, borderColor: "rgba(221,214,254,0.5)" }]}>
            <View style={[styles.statIcon, { backgroundColor: thirdStat.iconBg }]}>
              <Users size={18} color={thirdStat.color} />
            </View>
            {(isManager ? allCustomersQuery.isLoading : myCustomersQuery.isLoading) ? (
              <Skeleton width={28} height={20} />
            ) : (
              <Text style={styles.statNumber}>{thirdStat.value}</Text>
            )}
            <Text style={styles.statLabel}>{thirdStat.label}</Text>
          </View>
        </View>

        <View style={styles.kpiHeaderRow}>
          <Text style={styles.kpiHeaderTitle}>Chỉ số hiệu quả</Text>
          <View style={styles.kpiHeaderPeriod}>
            <Text style={styles.kpiHeaderPeriodText}>Kỳ hiện tại</Text>
            <View style={styles.pulseDot} />
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/crm/commission")}>
          <LinearGradient
            colors={[CRM_COLORS.primary, "#F4511E", CRM_COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.commissionCard}
          >
            <View style={styles.decorCircleTop} />
            <View style={styles.decorCircleBottom} />
            <View style={styles.commissionCardRow}>
              <View>
                <View style={styles.commissionLabelRow}>
                  <View style={styles.commissionIconBadge}>
                    <TrendingUp size={16} color="#fff" />
                  </View>
                  <Text style={styles.commissionLabel}>Hoa hồng dự kiến</Text>
                </View>
                {commissionQuery.isLoading ? (
                  <Skeleton width={120} height={22} style={{ marginTop: 8, backgroundColor: "rgba(255,255,255,0.35)" }} />
                ) : (
                  <Text style={styles.commissionAmount}>
                    {formatMoney(commissionTotal)} <Text style={styles.commissionUnit}>VND</Text>
                  </Text>
                )}
              </View>

              <View style={styles.sparklineRow}>
                {SPARKLINE_HEIGHTS.map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.sparklineBar,
                      { height: `${h}%`, backgroundColor: i === SPARKLINE_HEIGHTS.length - 1 ? "#fff" : "rgba(255,255,255,0.3)" },
                    ]}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.conversionCard}>
          <View style={styles.conversionLeft}>
            <LinearGradient colors={[CRM_COLORS.accent, "#60A5FA"]} style={styles.conversionIconBadge}>
              <PieChart size={20} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
            <View>
              <Text style={styles.conversionLabel}>Tỷ lệ chuyển đổi</Text>
              {conversionQuery.isLoading ? (
                <Skeleton width={50} height={20} style={{ marginTop: 2 }} />
              ) : (
                <Text style={styles.conversionValue}>{conversionRate === null ? "—" : `${conversionRate}%`}</Text>
              )}
            </View>
          </View>

          <View style={[styles.conversionTierPill, { backgroundColor: tier.bg }]}>
            <TrendingUp size={12} color={tier.color} strokeWidth={2.5} />
            <Text style={[styles.conversionTierText, { color: tier.color }]}>{tier.label}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeaderTitle}>Thao tác nhanh</Text>
        <View style={styles.actionsCard}>
          {visibleQuickActions.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.key}
                style={styles.actionItem}
                activeOpacity={0.8}
                onPress={() => router.push(action.route)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.bg, borderColor: action.borderColor }]}>
                  <Icon size={20} color={action.color} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={showQR} animationType="slide" onRequestClose={() => setShowQR(false)}>
        <LinearGradient colors={[CRM_COLORS.primary, "#F4511E", "#BF360C"]} style={styles.qrModalRoot}>
          <View style={[styles.decorBlob, { top: 60, left: -60, width: 190, height: 190 }]} />
          <View style={[styles.decorBlob, { top: 160, right: -50, width: 140, height: 140 }]} />
          <View style={[styles.decorBlob, { bottom: 120, left: -30, width: 110, height: 110 }]} />

          <View style={styles.qrModalHeader}>
            <TouchableOpacity onPress={() => setShowQR(false)} style={styles.qrCloseBtn} activeOpacity={0.8}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.qrModalTitle}>Mã giới thiệu</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.qrModalBody}>
            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
              <View style={styles.qrCard}>
                <View style={styles.qrProfile}>
                  <View style={styles.qrAvatarRing}>
                    {user?.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.qrAvatarImage} />
                    ) : (
                      <View style={styles.qrAvatarFallback}>
                        <Text style={styles.qrAvatarInitial}>{user?.full_name?.charAt(0)?.toUpperCase() ?? "?"}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.qrName}>{user?.full_name}</Text>
                  <Text style={styles.qrCode}>{user?.ma_nv}</Text>
                </View>

                <View style={styles.qrCodeArea}>
                  {qrQuery.data?.landing_url ? (
                    <QRCode value={qrQuery.data.landing_url} size={160} color="#000" backgroundColor="transparent" />
                  ) : (
                    <Text style={styles.qrMissingText}>Chưa có mã QR</Text>
                  )}
                </View>

                <View style={styles.qrCodeRow}>
                  <View>
                    <Text style={styles.qrCodeRowLabel}>Mã giới thiệu</Text>
                    <Text style={styles.qrCodeRowValue}>{referralCode}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCopyCode}
                    style={[styles.qrCopyBtn, copied && styles.qrCopyBtnActive]}
                    activeOpacity={0.8}
                  >
                    {copied ? <Check size={16} color="#059669" /> : <Copy size={16} color={CRM_COLORS.primary} />}
                  </TouchableOpacity>
                </View>
              </View>
            </ViewShot>

            <View style={styles.qrActionsRow}>
              <TouchableOpacity style={styles.qrActionGhost} activeOpacity={0.8} onPress={handleSaveImage}>
                <Download size={16} color="#fff" />
                <Text style={styles.qrActionGhostText}>Lưu ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrActionSolid} activeOpacity={0.8} onPress={handleShare}>
                <Share2 size={16} color={CRM_COLORS.primary} />
                <Text style={styles.qrActionSolidText}>Chia sẻ</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.qrFooterText}>Chia sẻ mã này để nhận hoa hồng giới thiệu</Text>
          </View>
        </LinearGradient>

        <Toast />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 16 },

  greetingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greetingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarRing: { borderWidth: 2, borderColor: "rgba(255,87,34,0.2)", borderRadius: CRM_RADIUS.md, padding: 1 },
  avatarFallback: { width: 44, height: 44, borderRadius: CRM_RADIUS.md - 2, backgroundColor: "#374151", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 44, height: 44, borderRadius: CRM_RADIUS.md - 2 },
  avatarInitial: { color: "#fff", fontWeight: "800", fontSize: 16 },
  userName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  userCode: { fontSize: 10, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  qrButton: { width: 40, height: 40, borderRadius: CRM_RADIUS.md, alignItems: "center", justifyContent: "center" },

  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, borderRadius: CRM_RADIUS.md, borderWidth: 1, padding: 12, alignItems: "center" },
  statIcon: { width: 40, height: 40, borderRadius: CRM_RADIUS.sm, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statNumber: { fontSize: 20, fontWeight: "900", color: "#111827" },
  statLabel: { fontSize: 10, color: "#6B7280", fontWeight: "500", marginTop: 4, textAlign: "center", lineHeight: 13 },

  kpiHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kpiHeaderTitle: { fontSize: 12, fontWeight: "800", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiHeaderPeriod: { flexDirection: "row", alignItems: "center", gap: 5 },
  kpiHeaderPeriodText: { fontSize: 10, color: "#9CA3AF", fontWeight: "500" },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },

  commissionCard: { borderRadius: CRM_RADIUS.lg, padding: 16, overflow: "hidden" },
  decorCircleTop: { position: "absolute", top: -20, right: -20, width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(255,255,255,0.1)" },
  decorCircleBottom: { position: "absolute", bottom: -32, left: -32, width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.1)" },
  commissionCardRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  commissionLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  commissionIconBadge: { width: 32, height: 32, borderRadius: CRM_RADIUS.sm, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  commissionLabel: { fontSize: 11, fontWeight: "700", color: "#FFF3EE" },
  commissionAmount: { fontSize: 24, fontWeight: "900", color: "#fff" },
  commissionUnit: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  sparklineRow: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 48, marginTop: 4 },
  sparklineBar: { width: 5, borderRadius: 3 },

  conversionCard: {
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.8)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  conversionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  conversionIconBadge: { width: 40, height: 40, borderRadius: CRM_RADIUS.sm, alignItems: "center", justifyContent: "center" },
  conversionLabel: { fontSize: 11, color: "#6B7280", fontWeight: "500", marginBottom: 2 },
  conversionValue: { fontSize: 20, fontWeight: "900", color: "#1a2b4b" },
  conversionTierPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: CRM_RADIUS.pill },
  conversionTierText: { fontSize: 10, fontWeight: "700" },

  sectionHeaderTitle: { fontSize: 12, fontWeight: "800", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  actionsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(243,244,246,0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  actionItem: { alignItems: "center", gap: 6, flex: 1 },
  actionIcon: { width: 48, height: 48, borderRadius: CRM_RADIUS.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 10, fontWeight: "700", color: "#374151", textAlign: "center" },

  qrModalRoot: { flex: 1 },
  decorBlob: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.05)" },
  qrModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  qrCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  qrModalTitle: { fontSize: 16, fontWeight: "900", color: "#fff" },
  qrModalBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, marginTop: -16 },
  qrCard: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.xl, padding: 24, width: Math.min(width - 48, 320) },
  qrProfile: { alignItems: "center", marginBottom: 20 },
  qrAvatarRing: { borderWidth: 3, borderColor: "rgba(255,87,34,0.2)", borderRadius: CRM_RADIUS.lg, padding: 2, marginBottom: 12 },
  qrAvatarFallback: { width: 58, height: 58, borderRadius: CRM_RADIUS.lg - 3, backgroundColor: "#374151", alignItems: "center", justifyContent: "center" },
  qrAvatarImage: { width: 58, height: 58, borderRadius: CRM_RADIUS.lg - 3 },
  qrAvatarInitial: { color: "#fff", fontWeight: "800", fontSize: 20 },
  qrName: { fontSize: 16, fontWeight: "900", color: "#111827" },
  qrCode: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  qrCodeArea: { backgroundColor: "#F9FAFB", borderRadius: CRM_RADIUS.md, padding: 20, marginBottom: 20, alignItems: "center", justifyContent: "center" },
  qrMissingText: { color: "#9CA3AF", fontSize: 13 },
  qrCodeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", borderRadius: CRM_RADIUS.sm, paddingHorizontal: 16, paddingVertical: 12 },
  qrCodeRowLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "500" },
  qrCodeRowValue: { fontSize: 14, fontWeight: "900", color: "#111827", letterSpacing: 0.5, marginTop: 2 },
  qrCopyBtn: { width: 36, height: 36, borderRadius: CRM_RADIUS.sm, backgroundColor: "rgba(255,87,34,0.1)", alignItems: "center", justifyContent: "center" },
  qrCopyBtnActive: { backgroundColor: "rgba(16,185,129,0.15)" },
  qrActionsRow: { flexDirection: "row", gap: 12, marginTop: 24, width: "100%", maxWidth: 320 },
  qrActionGhost: { flex: 1, paddingVertical: 14, borderRadius: CRM_RADIUS.md, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  qrActionGhostText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  qrActionSolid: { flex: 1, paddingVertical: 14, borderRadius: CRM_RADIUS.md, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  qrActionSolidText: { color: CRM_COLORS.primary, fontWeight: "700", fontSize: 13 },
  qrFooterText: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "500", marginTop: 16, textAlign: "center" },
});
