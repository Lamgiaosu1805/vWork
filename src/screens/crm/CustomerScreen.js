import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import Pagination from "./components/customer/Pagination";
import CustomerCard from "./components/customer/CustomerCard";
import FilterChip from "./components/customer/FilterChip";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useCustomer from "../../hooks/crm/useCustomer";

const ITEMS_PER_PAGE = 5;

export default function CustomerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { getCustomers } = useCustomer();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEkyc, setFilterEkyc] = useState("all");
  const [page, setPage] = useState(1);
  const [dataCustomers, setDataCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    () => Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)),
    [filtered.length],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const handlePage = useCallback(
    (n) => setPage((p) => Math.min(Math.max(1, n), totalPages)),
    [totalPages],
  );

  const loadDataCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      const apiData = res?.data?.data || [];
      setDataCustomers(apiData);
      console.log("Loaded customers (API shape):", apiData);
    } catch (error) {
      console.log("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataCustomers();
  }, []);

  // Clamp page if filters reduce total pages
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const handlePress = useCallback(
    (id) => navigation.navigate("UserDetail", { id }),
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
          paddingBottom: 16,
          paddingTop: insets.top + 12,
        }}
      >
        <View
          style={{
            width: 40,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 20,
          }}
        />

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#004643" }}>
            Danh sách khách hàng
          </Text>
        </View>

        <TouchableOpacity style={{ paddingRight: 20 }} activeOpacity={0.6}>
          <Ionicons name="person-add" size={24} color="#ED2E30" />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        data={paginated}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={loadDataCustomers}
        ListHeaderComponent={() => (
          <>
            {/* ── Search & Filters ── */}
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
                <FilterChip
                  label="Tất cả loại KH"
                  value={filterType}
                  onChange={(v) => {
                    setFilterType(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "Tất cả loại KH" },
                    { value: "vip", label: "KH VIP" },
                    { value: "potential", label: "KH Tiềm năng" },
                    { value: "normal", label: "KH Thường" },
                  ]}
                />
                <FilterChip
                  label="Tất cả EKYC"
                  value={filterEkyc}
                  onChange={(v) => {
                    setFilterEkyc(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "Tất cả EKYC" },
                    { value: "done", label: "Đã xác thực" },
                    { value: "not", label: "Chưa xác thực" },
                  ]}
                />
                <TouchableOpacity style={styles.calendarBtn}>
                  <Feather name="calendar" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── List header ── */}
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                Danh sách khách hàng ({filtered.length})
              </Text>
            </View>
          </>
        )}
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

  // List header
  listHeader: {
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
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
});
