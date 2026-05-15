import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Feather } from "@expo/vector-icons";
import CustomerCard from "../../components/crm/customer/CustomerCard";
import { Dropdown } from "react-native-element-dropdown";
import Header from "../../components/Header";
import { getAllCustomers } from "../../api/crm/customer";

const LIMIT = 5;

export default function AdminCustomerScreen() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSource, setFilterSource] = useState("all");

  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const debounceRef = useRef(null);
  const activeSearch = useRef("");

  const buildParams = (pg, searchVal) => {
    const params = { page: pg, limit: LIMIT };
    if (searchVal) params.search = searchVal;
    if (filterSource !== "all") params.source_type = filterSource;
    // map filterType → status
    if (filterType === "potential") params.status = "registered";
    else if (filterType === "normal") params.status = "kyc_verified";
    return params;
  };

  const fetchPage = async (pg, searchVal, isRefresh = false) => {
    if (pg === 1) {
      isRefresh ? setRefreshing(true) : setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await getAllCustomers(buildParams(pg, searchVal));
      const newItems = res?.data?.data || [];
      const pagination = res?.data?.pagination || {};

      setTotalPages(pagination.total_pages ?? 1);
      setTotal(pagination.total ?? 0);
      setData((prev) => (pg === 1 ? newItems : [...prev, ...newItems]));
      setPage(pg);
    } catch (error) {
      console.log("Error loading all customers:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Reset & fetch lại khi filter thay đổi
  useEffect(() => {
    fetchPage(1, activeSearch.current);
  }, [filterType, filterSource]);

  const handleSearchChange = (text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      activeSearch.current = text;
      fetchPage(1, text);
    }, 400);
  };

  const handleRefresh = () => {
    fetchPage(1, activeSearch.current, true);
  };

  const handleEndReached = () => {
    if (loadingMore || loading || page >= totalPages) return;
    fetchPage(page + 1, activeSearch.current);
  };

  const renderItem = useCallback(
    ({ item }) => <CustomerCard key={item._id} row={item} onPress={() => {}} />,
    [],
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#ED2E30" />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Header title="Quản lý khách hàng" />

      <View style={{ width: "100%", paddingHorizontal: 20, marginTop: 8 }}>
        <View style={styles.filterBar}>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#9DA4B0" style={styles.searchIcon} />
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
              selectedTextStyle={{ fontSize: 12, color: "#374151" }}
              iconStyle={{ width: 14, height: 14 }}
              itemTextStyle={{ fontSize: 12, color: "#374151" }}
              data={[
                { value: "all", label: "Tất cả loại KH" },
                { value: "potential", label: "KH Tiềm năng" },
                { value: "normal", label: "KH Thường" },
              ]}
              labelField="label"
              valueField="value"
              value={filterType}
              onChange={(item) => setFilterType(item.value)}
            />

            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              selectedTextStyle={{ fontSize: 12, color: "#374151" }}
              iconStyle={{ width: 14, height: 14 }}
              itemTextStyle={{ fontSize: 12, color: "#374151" }}
              data={[
                { value: "all", label: "Tất cả nguồn" },
                { value: "sale", label: "Qua Sale" },
                { value: "agent", label: "Qua Đại lý" },
                { value: "marketing", label: "Marketing" },
              ]}
              labelField="label"
              valueField="value"
              value={filterSource}
              onChange={(item) => setFilterSource(item.value)}
            />
          </View>
        </View>
      </View>

      <Text style={styles.listHeaderText}>
        Danh sách khách hàng ({total})
      </Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ED2E30" />
        </View>
      ) : (
        <FlatList
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <Feather name="users" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy khách hàng</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
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
  },
  listHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
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
