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
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Feather } from "@expo/vector-icons";
import Pagination from "../../components/crm/customer/Pagination";
import CustomerCard from "../../components/crm/customer/CustomerCard";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { canMgr } from "../../helpers/permissions";
import useCustomer from "../../hooks/crm/useCustomer";
import { Dropdown } from "react-native-element-dropdown";
import Header from "../../components/Header";
import { useSharedValue, withTiming } from "react-native-reanimated";
import CreateCustomerBottomSheet from "../../components/crm/customer/bottomsheet/CreateCustomerBottomSheet";

const ITEMS_PER_PAGE = 5;

export const HEIGHT_SHEET = Dimensions.get("screen").height;

export default function CustomerScreen() {
  const navigation = useNavigation();
  const { getCustomers } = useCustomer();
  const user = useSelector((state) => state.auth.user);
  const canAddCustomer = canMgr(user, "crm");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);
  const [dataCustomers, setDataCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const searchTimerRef = useRef(null);
  const translateCreateCustomerY = useSharedValue(HEIGHT_SHEET);

  const handlePage = useCallback(
    (n) => setPage(Math.min(Math.max(1, n), totalPages)),
    [totalPages],
  );

  useEffect(() => {
    const statusVal =
      filterType === "potential" ? "registered" :
      filterType === "normal" ? "kyc_verified" :
      undefined;

    const params = {
      page,
      limit: ITEMS_PER_PAGE,
      ...(debouncedSearch && { q: debouncedSearch }),
      ...(statusVal && { status: statusVal }),
    };

    const doFetch = async () => {
      setLoading(true);
      try {
        const res = await getCustomers(params);
        setDataCustomers(res?.data?.data || []);
        const pg = res?.data?.pagination || {};
        setTotal(pg.total || 0);
        setTotalPages(Math.max(1, pg.total_pages || 1));
      } catch (error) {
        console.log("Error loading customers:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    doFetch();
  }, [page, debouncedSearch, filterType, refreshKey]);

  const handleSearchChange = useCallback((v) => {
    setSearch(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(v);
    }, 400);
  }, []);

  const handleFilterTypeChange = useCallback((val) => {
    setFilterType(val);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setRefreshKey((k) => k + 1);
  }, []);

  const handlePress = useCallback(
    (id) => navigation.navigate("CustomerDetailScreen", { customerId: id }),
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
        rightIconName={canAddCustomer ? "person-add" : undefined}
        onRightPress={canAddCustomer ? () => { translateCreateCustomerY.value = withTiming(0); } : undefined}
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
              onChangeText={handleSearchChange}
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
              onChange={(item) => handleFilterTypeChange(item.value)}
            />

            <TouchableOpacity style={styles.calendarBtn}>
              <Feather name="calendar" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── List header ── */}
      <Text style={styles.listHeaderText}>
        Danh sách khách hàng ({total})
      </Text>

      <FlatList
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        data={dataCustomers}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
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
