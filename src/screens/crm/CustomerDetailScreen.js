import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import useCustomer from "../../hooks/crm/useCustomer";
import { useNavigation, useRoute } from "@react-navigation/native";
import CustomerStats from "../../components/crm/customerDetail/CustomerStats";
import CustomerTabs from "../../components/crm/customerDetail/CustomerTabs";
import TransactionTabs from "../../components/crm/customerDetail/TransactionTabs";
import InfoTab from "../../components/crm/customerDetail/InfoTab";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import InvestmentTabs from "../../components/crm/customerDetail/InvestmentTabs";

const PRIMARY = "#ED2E30";

export default function CustomerDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const accessToken = useSelector((s) => s.auth.accessToken);
  const { externalId, ma_nv } = route.params;

  const {
    getCustomerDetailInfo,
    getCustomerFluctuation,
    getInvestmentHolding,
    getStaffInfo,
    loading,
  } = useCustomer();

  const [staff, setStaff] = useState(null);
  const [detail, setDetail] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [investment, setInvestment] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [paginationTransaction, setPaginationTransaction] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1,
  });
  const [paginationInvestment, setPaginationInvestment] = useState({
    total: 0,
    page: 0,
    limit: 10,
    total_pages: 1,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageTransaction, setPageTransaction] = useState(1);
  const [pageInvestment, setPageInvestment] = useState(0);
  const [filterTransaction, setFilterTransaction] = useState({
    from: null,
    to: null,
  });
  const [filterInvestment, setFilterInvestment] = useState({
    from: null,
    to: null,
  });

  const fetchStaffInfo = useCallback(async () => {
    if (!ma_nv) return;

    const res = await getStaffInfo({
      ma_nv: ma_nv,
    });

    setStaff(res?.data?.data || null);
  }, [ma_nv]);

  const fetchInvestmentHolding = useCallback(async () => {
    const res = await getInvestmentHolding({
      external_id: externalId,
      pageSize: 10,
      pageNumber: pageInvestment,
      type: 1,
      fromDate: filterInvestment.from
        ? filterInvestment.from.format("YYYY-MM-DD")
        : null,
      toDate: filterInvestment.to
        ? filterInvestment.to.format("YYYY-MM-DD")
        : null,
    });

    const totalRecords = res?.data?.data?.totalRecords || 0;

    const items = res?.data?.data?.investmentHoldingProducts || [];

    setInvestment((prev) =>
      pageInvestment === 0 ? items : [...(prev || []), ...items],
    );

    setPaginationInvestment({
      page: pageInvestment,
      limit: 10,
      total: totalRecords,
      total_pages: Math.ceil(totalRecords / 10),
    });
  }, [externalId, filterInvestment, pageInvestment]);

  const fetchCustomerInfo = useCallback(async () => {
    const res = await getCustomerDetailInfo({
      external_id: externalId,
    });
    setDetail(res?.data?.data || null);
  }, [externalId]);

  const fetchFluctuation = useCallback(async () => {
    const res = await getCustomerFluctuation({
      external_id: externalId,
      limit: 10,
      page: pageTransaction,
      start_date: filterTransaction.from
        ? filterTransaction.from.format("YYYY-MM-DD")
        : null,
      end_date: filterTransaction.to
        ? filterTransaction.to.format("YYYY-MM-DD")
        : null,
    });

    setTransactions((prev) =>
      pageTransaction === 1 ? res?.data?.data : [...prev, ...res?.data?.data],
    );
    setPaginationTransaction(res?.data?.pagination || {});
  }, [externalId, pageTransaction, filterTransaction]);

  const onLoadMore = async () => {
    if (
      loadingMore ||
      pageTransaction >= paginationTransaction.total_pages ||
      pageInvestment >= paginationInvestment.total_pages
    )
      return;
    try {
      setLoadingMore(true);
      if (activeTab === "transaction") {
        setPageTransaction((p) => p + 1);
      } else if (activeTab === "investment") {
        setPageInvestment((p) => p + 1);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const getInitials = (name = "") => {
    if (!name) return "KH";
    return name
      .trim()
      .split(" ")
      .slice(-2)
      .map((i) => i[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    if (activeTab === "info") {
      fetchCustomerInfo();
    } else if (activeTab === "transaction") {
      fetchFluctuation();
    } else if (activeTab === "investment") {
      fetchInvestmentHolding();
    }
  }, [
    activeTab,
    pageTransaction,
    pageInvestment,
    filterTransaction,
    filterInvestment,
  ]);

  useEffect(() => {
    fetchStaffInfo();
  }, [fetchStaffInfo]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      activeTab === "info"
        ? await fetchCustomerInfo()
        : activeTab === "transaction"
          ? await fetchFluctuation()
          : await fetchInvestmentHolding();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !detail) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  console.log({
    pageInvestment,
    totalPages: paginationInvestment.total_pages,
  });
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[PRIMARY]}
        />
      }
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;

        const isCloseToBottom =
          layoutMeasurement.height + contentOffset.y >=
          contentSize.height - 100;

        if (isCloseToBottom && !loadingMore) {
          if (
            activeTab === "transaction" &&
            pageTransaction < paginationTransaction.total_pages
          ) {
            setPageTransaction((p) => p + 1);
          }

          if (
            activeTab === "investment" &&
            pageInvestment < paginationInvestment.total_pages
          ) {
            setPageInvestment((p) => p + 1);
          }
        }
      }}
      scrollEventThrottle={16}
    >
      <LinearGradient
        colors={["#FF2D2F", "#F6A56B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(detail?.fullName)}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{detail?.fullName || "Khách hàng"}</Text>
          <Text style={styles.subText}>
            Username: {detail?.userName || "--"}
          </Text>
          <Text style={styles.subText}>
            Mã tài khoản: {detail?.bankAccountVnfite || "--"}
          </Text>
          <View style={styles.verifyBadge}>
            <View style={styles.dot} />
            <Text style={styles.verifyText}>Đã xác thực</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            Toast.show({ type: "info", text1: "Tính năng đang phát triển" })
          }
        >
          <Feather name="edit-2" size={15} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <CustomerStats detail={detail} />
      <CustomerTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "info" && (
        <InfoTab detail={detail} accessToken={accessToken} staff={staff} />
      )}
      {activeTab === "transaction" && (
        <TransactionTabs
          pagination={paginationTransaction}
          transactions={transactions}
          fromDate={filterTransaction.from}
          setFromDate={(from) =>
            setFilterTransaction((f) => ({
              ...f,
              from: from,
            }))
          }
          toDate={filterTransaction.to}
          setToDate={(to) =>
            setFilterTransaction((f) => ({
              ...f,
              to: to,
            }))
          }
          loadingMore={loadingMore}
        />
      )}
      {activeTab === "investment" && (
        <InvestmentTabs
          investment={investment}
          pagination={paginationInvestment}
          fromDate={filterInvestment.from}
          setFromDate={(from) =>
            setFilterInvestment((f) => ({
              ...f,
              from: from,
            }))
          }
          toDate={filterInvestment.to}
          setToDate={(to) =>
            setFilterInvestment((f) => ({
              ...f,
              to: to,
            }))
          }
          isLoading={loading}
          loadingMore={loadingMore}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  name: { color: "#fff", fontSize: 17, fontWeight: "800" },
  subText: { color: "#fff", fontSize: 12, marginTop: 3 },
  verifyBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  verifyText: { color: "#047857", fontSize: 11, fontWeight: "600" },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
