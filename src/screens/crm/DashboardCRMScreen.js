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
import { SafeAreaView } from "react-native-safe-area-context";
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

  const fetchAll = useCallback(async () => {
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

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
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
          {/* Khách hàng của tôi */}
          <View style={[styles.statCard, { backgroundColor: "#EFF6FF" }]}>
            <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="person-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{myCustomers.total}</Text>
            <Text style={styles.statLabel}>KH của tôi</Text>
          </View>

          {/* Hoa hồng tháng này */}
          <View style={[styles.statCard, { backgroundColor: "#ECFDF5" }]}>
            <View style={[styles.statIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="cash-outline" size={20} color="#059669" />
            </View>
            <Text style={[styles.statNumber, { fontSize: 16 }]}>{formatMoney(commission.total)}</Text>
            <Text style={styles.statLabel}>Hoa hồng T{month}</Text>
          </View>

          {/* Tổng KH — chỉ manager */}
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
    </SafeAreaView>
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

  qrCard: {
    backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, paddingBottom: 20,
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

  section: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: "#fff",
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  customerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", gap: 12 },
  customerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center" },
  customerAvatarText: { fontSize: 15, fontWeight: "700", color: "#2563EB" },
  customerName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  customerPhone: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  customerDate: { fontSize: 12, color: "#9CA3AF" },
  viewAllText: { textAlign: "center", marginTop: 12, fontSize: 13, color: "#2563EB", fontWeight: "600" },
});
