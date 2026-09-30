import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useMemo, useRef, useState } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import { useAppSwitcher } from "../../crm/context/AppSwitcherContext";
import useAllCustomersList from "../hooks/useAllCustomersList";
import useUnassignCustomer from "../hooks/useUnassignCustomer";
import CustomerCard from "./CustomerCard";
import CustomerCardSkeleton from "./CustomerCardSkeleton";
import CustomerFilterSheet from "./CustomerFilterSheet";
import AssignCustomerModal from "./AssignCustomerModal";

const buildParams = (search, filters, appCode) => {
  const params = {};
  if (search) params.search = search;
  if (appCode) params.app_code = appCode;
  if (filters.funnel_status.length) params.funnel_status = filters.funnel_status.join(",");
  if (filters.behavior.length) params.behavior = filters.behavior.join(",");
  if (filters.role_type.length) params.role_type = filters.role_type.join(",");
  if (filters.assigned) params.assigned = filters.assigned;
  if (filters.branch_id) params.branch_id = filters.branch_id;
  if (filters.sale_ids.length) params.sale_ids = filters.sale_ids.join(",");
  if (filters.from_date) params.from_date = filters.from_date;
  if (filters.to_date) params.to_date = filters.to_date;
  return params;
};

const hasActiveFilters = (filters) =>
  filters.funnel_status.length ||
  filters.behavior.length ||
  filters.role_type.length ||
  filters.assigned ||
  filters.branch_id ||
  filters.sale_ids.length ||
  filters.from_date ||
  filters.to_date;

const CustomerDirectoryScreen = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef(null);

  const [filters, setFilters] = useState(CustomerFilterSheet.ALL_DEFAULT);
  const [assignTarget, setAssignTarget] = useState(null);
  const filterSheetRef = useRef(null);
  const unassignMutation = useUnassignCustomer();
  const { appCode } = useAppSwitcher();

  const params = useMemo(() => buildParams(debouncedSearch, filters, appCode), [debouncedSearch, filters, appCode]);
  const allQuery = useAllCustomersList(params);

  const items = useMemo(() => allQuery.data?.pages?.flatMap((p) => p.items) ?? [], [allQuery.data]);
  const total = allQuery.data?.pages?.[0]?.total ?? 0;

  const handleSearchChange = (v) => {
    setSearch(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(v), 400);
  };

  const handlePress = (item) => {
    const maNv = item?.referred_by?.ma_nv;
    router.push({ pathname: "/crm/customer-detail", params: { externalId: item.external_id, ma_nv: maNv } });
  };

  const handleUnassign = (item) => {
    Alert.alert("Xóa phân công sale", `Gỡ ${item.referred_by?.full_name || "sale hiện tại"} khỏi khách hàng này?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa phân công",
        style: "destructive",
        onPress: async () => {
          try {
            await unassignMutation.mutateAsync({ id: item._id, payload: {} });
            Toast.show({ type: "success", text1: "Đã xóa phân công sale" });
          } catch (error) {
            Toast.show({ type: "error", text1: error?.response?.data?.message || "Có lỗi xảy ra" });
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const hasSale = !!item.referred_by;
    const canReassign = hasSale;
    const canAssign = !hasSale;

    return (
      <CustomerCard
        row={item}
        onPress={() => handlePress(item)}
        actions={
          (canAssign || canReassign) && (
            <View style={styles.customerActions}>
              <TouchableOpacity style={[styles.assignBtn, canReassign && styles.reassignBtn]} onPress={() => setAssignTarget(item)} activeOpacity={0.8}>
                <Ionicons name={canReassign ? "swap-horizontal" : "person-add"} size={14} color={canReassign ? "#D97706" : "#fff"} />
                <Text style={[styles.assignBtnText, canReassign && styles.reassignBtnText]}>{canReassign ? "Chuyển sale" : "Phân khách"}</Text>
              </TouchableOpacity>
              {canReassign && (
                <TouchableOpacity style={[styles.assignBtn, styles.unassignBtn]} onPress={() => handleUnassign(item)} activeOpacity={0.8}>
                  <Ionicons name="person-remove" size={14} color="#DC2626" />
                  <Text style={styles.unassignBtnText}>Xóa phân công</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color="#9DA4B0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, số điện thoại..."
            placeholderTextColor="#9DA4B0"
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => filterSheetRef.current?.present()} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={18} color={CRM_COLORS.textDark} />
          {hasActiveFilters(filters) ? <View style={styles.filterDot} /> : null}
        </TouchableOpacity>
      </View>

      <Text style={styles.listHeaderText}>Tất cả khách hàng ({total})</Text>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (allQuery.hasNextPage && !allQuery.isFetchingNextPage) allQuery.fetchNextPage();
        }}
        refreshing={allQuery.isRefetching}
        onRefresh={() => allQuery.refetch()}
        ListEmptyComponent={() =>
          allQuery.isLoading ? (
            <View>
              {Array.from({ length: 5 }).map((_, i) => (
                <CustomerCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Feather name="users" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy khách hàng</Text>
            </View>
          )
        }
        ListFooterComponent={() => (allQuery.isFetchingNextPage ? <ActivityIndicator size="small" color={CRM_COLORS.primary} style={{ marginVertical: 16 }} /> : null)}
      />

      <CustomerFilterSheet ref={filterSheetRef} value={filters} onApply={setFilters} />

      {assignTarget && <AssignCustomerModal customer={assignTarget} onClose={() => setAssignTarget(null)} onSuccess={() => allQuery.refetch()} />}
    </View>
  );
};

export default CustomerDirectoryScreen;

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 12 },
  searchRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  searchWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: CRM_RADIUS.sm, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  filterBtn: { width: 42, height: 42, borderRadius: CRM_RADIUS.sm, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  filterDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: CRM_COLORS.primary },
  listHeaderText: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 12, paddingHorizontal: 16 },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  customerActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  assignBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: CRM_RADIUS.sm, backgroundColor: CRM_COLORS.primary },
  assignBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  reassignBtn: { backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A" },
  reassignBtnText: { color: "#D97706" },
  unassignBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  unassignBtnText: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
});
