import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import Pagination from "../../components/crm/customer/Pagination";
import CustomerCard from "../../components/crm/customer/CustomerCard";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useCustomer from "../../hooks/crm/useCustomer";
import { Dropdown } from "react-native-element-dropdown";
import Header from "../../components/Header";
import BottomSheet from "../../components/crm/BottomSheet";
import {
  cancelAnimation,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import CreateCustomerBottomSheet from "../../components/crm/customer/bottomsheet/CreateCustomerBottomSheet";

const ITEMS_PER_PAGE = 10;

export const HEIGHT_SHEET = Dimensions.get("screen").height;

export default function CustomerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { getCustomers } = useCustomer();
  const listRef = useRef(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEkyc, setFilterEkyc] = useState("all");
  const [page, setPage] = useState(1);
  const [dataCustomers, setDataCustomers] = useState([]);
  const [apiPagination, setApiPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const translateCreateCustomerY = useSharedValue(HEIGHT_SHEET);

  const filtered = useMemo(() => {
    return dataCustomers.filter((r) => {
      const name = r.identity?.full_name || r.phone_number || "";
      const matchSearch =
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        (r.phone_number || "").includes(search);

      const custType =
        r.status === "registered"
          ? "potential"
          : r.status === "kyc_verified"
            ? "normal"
            : "vip";

      const matchType = filterType === "all" || custType === filterType;

      const matchEkyc =
        filterEkyc === "all" ||
        (filterEkyc === "done" && Boolean(r.identity?.verified_at)) ||
        (filterEkyc === "not" && !r.identity?.verified_at);

      return matchSearch && matchType && matchEkyc;
    });
  }, [dataCustomers, search, filterType, filterEkyc]);

  const totalPages = useMemo(
    () => Math.max(1, apiPagination.total_pages || 1),
    [apiPagination.total_pages],
  );

  const paginated = useMemo(() => filtered, [filtered]);

  const handlePage = useCallback(
    async (n) => {
      const nextPage = Math.min(Math.max(1, n), totalPages);
      if (nextPage === page || loading || pageLoading) return;

      setPage(nextPage);
      listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      await loadDataCustomers(nextPage, { pageChange: true });
    },
    [page, totalPages, loading, pageLoading],
  );

  const loadDataCustomers = async (nextPage = page, options = {}) => {
    const { refresh = false, pageChange = false } = options;

    if (pageChange) {
      setPageLoading(true);
    } else {
      setLoading(true);
    }
    if (refresh) setRefreshing(true);
    try {
      const res = await getCustomers({
        page: nextPage,
        limit: ITEMS_PER_PAGE,
      });
      const apiData = res?.data?.data || [];
      setDataCustomers(apiData);
      setApiPagination(
        res?.data?.pagination || {
          page: nextPage,
          total_pages: 1,
          total: apiData.length,
        },
      );
    } catch (error) {
      console.log("Error loading customers:", error);
    } finally {
      if (pageChange) {
        setPageLoading(false);
      } else {
        setLoading(false);
      }
      if (refresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDataCustomers(1);
  }, []);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handlePress = useCallback(
    (id) => console.log("Customer ID pressed:", id),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <CustomerCard
        key={item._id}
        row={item}
        onPress={() => handlePress(item._id)}
      />
    ),
    [handlePress],
  );

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Header
        title="Danh sách khách hàng"
        rightIconName={"person-add"}
        onRightPress={() => {
          translateCreateCustomerY.value = withTiming(0);
        }}
      />

      <View style={{ width: "100%", paddingHorizontal: 20, marginTop: 8 }}>
        <View style={styles.filterBar}>
          <View style={styles.searchWrap}>
            <Feather
              name="search"
              size={16}
              color="#9DA4B0"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm theo tên, số điện thoại..."
              placeholderTextColor="#9DA4B0"
              value={search}
              onChangeText={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
          </View>

          <View style={styles.filtersRow}>
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              selectedTextStyle={{
                fontSize: 12,
                color: "#374151",
              }}
              iconStyle={{ width: 14, height: 14 }}
              itemTextStyle={{
                fontSize: 12,
                color: "#374151",
              }}
              data={[
                { value: "all", label: "Tất cả loại KH" },
                { value: "vip", label: "KH VIP" },
                { value: "potential", label: "KH Tiềm năng" },
                { value: "normal", label: "KH Thường" },
              ]}
              labelField="label"
              valueField="value"
              value={filterType}
              placeholder="Tất cả loại KH"
              onChange={(item) => {
                setFilterType(item.value);
                setPage(1);
              }}
            />

            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              selectedTextStyle={{
                fontSize: 12,
                color: "#374151",
              }}
              iconStyle={{ width: 14, height: 14 }}
              itemTextStyle={{
                fontSize: 12,
                color: "#374151",
              }}
              data={[
                { value: "all", label: "Tất cả EKYC" },
                { value: "done", label: "Đã xác thực" },
                { value: "not", label: "Chưa xác thực" },
              ]}
              labelField="label"
              valueField="value"
              value={filterEkyc}
              placeholder="Tất cả EKYC"
              onChange={(item) => {
                setFilterEkyc(item.value);
                setPage(1);
              }}
            />

            <TouchableOpacity style={styles.calendarBtn}>
              <Feather name="calendar" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── List header ── */}
      <Text style={styles.listHeaderText}>
        Danh sách khách hàng ({apiPagination.total || filtered.length})
      </Text>

      <FlatList
        ref={listRef}
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        data={paginated}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={() => loadDataCustomers(page, { refresh: true })}
        ListHeaderComponent={
          pageLoading ? (
            <View style={styles.pageLoadingWrap}>
              <ActivityIndicator size="small" color="#004643" />
              <Text style={styles.pageLoadingText}>Đang tải trang...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() =>
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#ED2E30" />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Feather name="users" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy khách hàng</Text>
            </View>
          )
        }
        ListFooterComponent={() =>
          totalPages > 1 ? (
            <Pagination
              current={page}
              total={totalPages}
              onPrev={() => handlePage(page - 1)}
              onNext={() => handlePage(page + 1)}
              onPage={handlePage}
              loading={pageLoading}
            />
          ) : null
        }
      />

      <CreateCustomerBottomSheet
        translateCreateCustomerY={translateCreateCustomerY}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  // Filter bar
  filterBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    height: 40,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginLeft: "auto",
  },

  listHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  pageLoadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  pageLoadingText: {
    fontSize: 13,
    color: "#004643",
    fontWeight: "600",
  },

  dropdown: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  dropdownContainer: {
    borderRadius: 8,
  },
});
