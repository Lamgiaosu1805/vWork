import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useMemo, useRef, useState } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { startCall, OmiCallState } from "omikit-plugin";
import { showCallError } from "../../../helpers/omicallHelper";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import { useAppSwitcher } from "../../crm/context/AppSwitcherContext";
import { DialCallModal } from "../../crm/components/omicall/DialCallModal";
import useCustomersToCall from "../hooks/useCustomersToCall";
import useRecordCallAttempt from "../hooks/useRecordCallAttempt";
import CustomerCallCard from "./CustomerCallCard";
import CustomerCallCardSkeleton from "./CustomerCallCardSkeleton";
import CustomerCallDetailSheet from "./CustomerCallDetailSheet";
import ConfirmCallModal from "./ConfirmCallModal";
import CallWorklistFilterSheet, { CALL_WORKLIST_DEFAULT_FILTERS } from "./CallWorklistFilterSheet";

const buildParams = (search, filters, appCode) => {
  const params = {};
  if (search) params.search = search;
  if (appCode) params.appCode = appCode;
  if (filters.status.length) params.status = filters.status.join(",");
  if (filters.relationshipStatus.length) params.relationshipStatus = filters.relationshipStatus.join(",");
  if (filters.callCount.length) params.callCount = filters.callCount.join(",");
  return params;
};

const hasActiveFilters = (filters) =>
  filters.status.length || filters.relationshipStatus.length || filters.callCount.length;

const CustomerCallListTab = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef(null);

  const [filters, setFilters] = useState(CALL_WORKLIST_DEFAULT_FILTERS);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToCall, setCustomerToCall] = useState(null);
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [callerNumber, setCallerNumber] = useState(null);
  const filterSheetRef = useRef(null);
  const { appCode } = useAppSwitcher();

  const params = useMemo(() => buildParams(debouncedSearch, filters, appCode), [debouncedSearch, filters, appCode]);
  const worklistQuery = useCustomersToCall(params);
  const recordCallAttemptMutation = useRecordCallAttempt();

  const items = useMemo(() => worklistQuery.data?.pages?.flatMap((p) => p.items) ?? [], [worklistQuery.data]);
  const total = worklistQuery.data?.pages?.[0]?.total ?? 0;

  const handleSearchChange = (v) => {
    setSearch(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(v), 400);
  };

  const handlePress = (row) => {
    setSelectedCustomer(row);
  };

  const handleCallFromDetail = (customer) => {
    setSelectedCustomer(null);
    setCustomerToCall(customer);
  };

  const handleConfirmCall = async () => {
    const customer = customerToCall;
    setCustomerToCall(null);
    try {
      const rawResult = await startCall({ phoneNumber: customer.phone_number, isVideo: false });
      const result = typeof rawResult === "string" ? JSON.parse(rawResult) : rawResult;
      if (result.status === 8 || result.status === 407) {
        recordCallAttemptMutation.mutate(customer._id);
        setCallerNumber(customer.phone_number);
        setIsCallModalVisible(true);
      } else {
        showCallError(result.status, result.message_detail || result.message);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Không thể gọi", text2: err?.message || "Lỗi không xác định" });
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#9DA4B0" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm tên, SĐT khách hàng..."
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

        <View style={styles.divider} />

        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          data={items}
          renderItem={({ item }) => (
            <CustomerCallCard row={item} onPress={() => handlePress(item)} onCallPress={() => setCustomerToCall(item)} />
          )}
          keyExtractor={(item) => item._id}
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (worklistQuery.hasNextPage && !worklistQuery.isFetchingNextPage) worklistQuery.fetchNextPage();
          }}
          refreshing={worklistQuery.isRefetching}
          onRefresh={() => worklistQuery.refetch()}
          ListEmptyComponent={() =>
            worklistQuery.isLoading ? (
              <View>
                {Array.from({ length: 5 }).map((_, i) => (
                  <CustomerCallCardSkeleton key={i} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Feather name="users" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>Không tìm thấy khách hàng nào phù hợp</Text>
              </View>
            )
          }
          ListFooterComponent={() =>
            worklistQuery.isFetchingNextPage ? (
              <ActivityIndicator size="small" color={CRM_COLORS.primary} style={{ marginVertical: 16 }} />
            ) : items.length > 0 ? (
              <Text style={styles.footerCountText}>
                Hiển thị {items.length} trong tổng số {total} khách hàng
              </Text>
            ) : null
          }
        />
      </View>

      <CallWorklistFilterSheet ref={filterSheetRef} value={filters} onApply={setFilters} />

      <CustomerCallDetailSheet customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onCallPress={handleCallFromDetail} />

      <ConfirmCallModal customer={customerToCall} onClose={() => setCustomerToCall(null)} onConfirm={handleConfirmCall} />

      <DialCallModal
        visible={isCallModalVisible}
        status={OmiCallState.calling}
        callerNumber={callerNumber}
        onClose={() => setIsCallModalVisible(false)}
      />
    </View>
  );
};

export default CustomerCallListTab;

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.lg,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 12,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchRow: { flexDirection: "row", gap: 10 },
  searchWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F9FAFB", borderRadius: CRM_RADIUS.sm, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  filterBtn: { width: 42, height: 42, borderRadius: CRM_RADIUS.sm, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  filterDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: CRM_COLORS.primary },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginTop: 12 },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  footerCountText: { textAlign: "center", fontSize: 11, color: "#6B7280", fontWeight: "500", marginTop: 8, marginBottom: 4 },
});
