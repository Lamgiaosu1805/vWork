import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { Skeleton, SkeletonCircle } from "../../../components/Skeleton";
import { useSelector } from "react-redux";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import CustomerStats from "../../../features/crmCustomer/components/customerDetail/CustomerStats";
import CustomerTabs from "../../../features/crmCustomer/components/customerDetail/CustomerTabs";
import TransactionTabs from "../../../features/crmCustomer/components/customerDetail/TransactionTabs";
import InfoTab from "../../../features/crmCustomer/components/customerDetail/InfoTab";
import InvestmentTabs from "../../../features/crmCustomer/components/customerDetail/InvestmentTabs";
import useCustomerDetailInfo from "../../../features/crmCustomer/hooks/useCustomerDetailInfo";
import useCustomerStaffInfo from "../../../features/crmCustomer/hooks/useCustomerStaffInfo";
import useCustomerFluctuation from "../../../features/crmCustomer/hooks/useCustomerFluctuation";
import useCustomerInvestmentHolding from "../../../features/crmCustomer/hooks/useCustomerInvestmentHolding";
import { CRM_COLORS } from "../../../features/crm/theme/colors";

export default function CustomerDetailScreen() {
  const { externalId, ma_nv: maNv } = useLocalSearchParams();
  const accessToken = useSelector((s) => s.auth.accessToken);

  const [activeTab, setActiveTab] = useState("info");
  const [refreshing, setRefreshing] = useState(false);
  const [filterTransaction, setFilterTransaction] = useState({ from: null, to: null });
  const [filterInvestment, setFilterInvestment] = useState({ from: null, to: null });

  const detailQuery = useCustomerDetailInfo(externalId);
  const staffQuery = useCustomerStaffInfo(maNv);
  const fluctuationQuery = useCustomerFluctuation(externalId, filterTransaction);
  const investmentQuery = useCustomerInvestmentHolding(externalId, filterInvestment);

  const detail = detailQuery.data;
  const staff = staffQuery.data;

  const transactions = useMemo(
    () => fluctuationQuery.data?.pages?.flatMap((p) => p.items) ?? [],
    [fluctuationQuery.data],
  );
  const investments = useMemo(
    () => investmentQuery.data?.pages?.flatMap((p) => p.items) ?? [],
    [investmentQuery.data],
  );

  const getInitials = (name = "") => {
    if (!name) return "KH";
    return name.trim().split(" ").slice(-2).map((i) => i[0]).join("").toUpperCase();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === "info") await detailQuery.refetch();
      else if (activeTab === "transaction") await fluctuationQuery.refetch();
      else if (activeTab === "investment") await investmentQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (detailQuery.isLoading && !detail) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: "#E2E8F0" }]}>
          <View style={styles.backBtn} />
          <SkeletonCircle size={56} style={{ backgroundColor: "#CBD5E1" }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="50%" height={16} style={{ backgroundColor: "#CBD5E1" }} />
            <Skeleton width="70%" height={12} style={{ backgroundColor: "#CBD5E1" }} />
            <Skeleton width="60%" height={12} style={{ backgroundColor: "#CBD5E1" }} />
          </View>
        </View>

        <View style={styles.skeletonStatsRow}>
          <Skeleton width="30%" height={56} borderRadius={12} />
          <Skeleton width="30%" height={56} borderRadius={12} />
          <Skeleton width="30%" height={56} borderRadius={12} />
        </View>

        <View style={styles.skeletonTabsRow}>
          <Skeleton width={80} height={32} borderRadius={16} />
          <Skeleton width={80} height={32} borderRadius={16} />
          <Skeleton width={80} height={32} borderRadius={16} />
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 8 }}>
          <Skeleton width="100%" height={60} borderRadius={12} />
          <Skeleton width="100%" height={60} borderRadius={12} />
          <Skeleton width="100%" height={60} borderRadius={12} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CRM_COLORS.primary]} />}
    >
      <LinearGradient colors={[CRM_COLORS.primary, CRM_COLORS.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(detail?.fullName)}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{detail?.fullName || "Khách hàng"}</Text>
          <Text style={styles.subText}>Username: {detail?.userName || "--"}</Text>
          <Text style={styles.subText}>Mã tài khoản: {detail?.bankAccountVnfite || "--"}</Text>
          <View style={styles.verifyBadge}>
            <View style={styles.dot} />
            <Text style={styles.verifyText}>Đã xác thực</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => Toast.show({ type: "info", text1: "Tính năng đang phát triển" })}>
          <Feather name="edit-2" size={15} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <CustomerStats detail={detail} />
      <CustomerTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "info" && <InfoTab detail={detail} accessToken={accessToken} staff={staff} />}

      {activeTab === "transaction" && (
        <TransactionTabs
          transactions={transactions}
          hasMore={!!fluctuationQuery.hasNextPage}
          isLoadingMore={fluctuationQuery.isFetchingNextPage}
          onLoadMore={() => fluctuationQuery.fetchNextPage()}
          fromDate={filterTransaction.from}
          setFromDate={(from) => setFilterTransaction((f) => ({ ...f, from }))}
          toDate={filterTransaction.to}
          setToDate={(to) => setFilterTransaction((f) => ({ ...f, to }))}
        />
      )}

      {activeTab === "investment" && (
        <InvestmentTabs
          investment={investments}
          hasMore={!!investmentQuery.hasNextPage}
          isLoadingMore={investmentQuery.isFetchingNextPage}
          onLoadMore={() => investmentQuery.fetchNextPage()}
          fromDate={filterInvestment.from}
          setFromDate={(from) => setFilterInvestment((f) => ({ ...f, from }))}
          toDate={filterInvestment.to}
          setToDate={(to) => setFilterInvestment((f) => ({ ...f, to }))}
        />
      )}

      {activeTab === "care" && (
        <View style={styles.careEmpty}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color="#D1D5DB" />
          <Text style={styles.careEmptyText}>Tính năng lịch sử chăm sóc đang được xây dựng.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  skeletonStatsRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 16, gap: 10 },
  skeletonTabsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { paddingVertical: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#374151", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  name: { color: "#fff", fontSize: 17, fontWeight: "800" },
  subText: { color: "#fff", fontSize: 12, marginTop: 3 },
  verifyBadge: { marginTop: 8, alignSelf: "flex-start", backgroundColor: "#D1FAE5", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  verifyText: { color: "#047857", fontSize: 11, fontWeight: "600" },
  editBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  careEmpty: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  careEmptyText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
});
