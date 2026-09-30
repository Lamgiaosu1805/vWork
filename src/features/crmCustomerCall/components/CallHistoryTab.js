import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useMemo, useRef, useState } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import { useAppSwitcher } from "../../crm/context/AppSwitcherContext";
import useCallHistory from "../hooks/useCallHistory";
import CallHistoryCard from "./CallHistoryCard";
import CallHistoryCardSkeleton from "./CallHistoryCardSkeleton";
import CallHistoryDetailSheet from "./CallHistoryDetailSheet";
import CallHistoryFilterSheet, { CALL_HISTORY_DEFAULT_FILTERS } from "./CallHistoryFilterSheet";

const buildParams = (search, filters, appCode) => {
  const params = {};
  if (search) params.search = search;
  if (appCode) params.appCode = appCode;
  if (filters.direction.length === 1) params.direction = filters.direction[0];
  if (filters.from_date) params.fromDate = filters.from_date;
  if (filters.to_date) params.toDate = filters.to_date;
  return params;
};

const hasActiveFilters = (filters) => filters.direction.length === 1 || filters.from_date || filters.to_date;

const CallHistoryTab = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef(null);

  const [filters, setFilters] = useState(CALL_HISTORY_DEFAULT_FILTERS);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const filterSheetRef = useRef(null);
  const { appCode } = useAppSwitcher();

  const params = useMemo(() => buildParams(debouncedSearch, filters, appCode), [debouncedSearch, filters, appCode]);
  const historyQuery = useCallHistory(params);

  const items = useMemo(() => historyQuery.data?.pages?.flatMap((p) => p.items) ?? [], [historyQuery.data]);
  const total = historyQuery.data?.pages?.[0]?.total ?? 0;

  const handleSearchChange = (v) => {
    setSearch(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(v), 400);
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#9DA4B0" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tên / SĐT khách hàng"
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
          renderItem={({ item }) => <CallHistoryCard row={item} onPress={() => setSelectedRecord(item)} />}
          keyExtractor={(item) => item._id}
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) historyQuery.fetchNextPage();
          }}
          refreshing={historyQuery.isRefetching}
          onRefresh={() => historyQuery.refetch()}
          ListEmptyComponent={() =>
            historyQuery.isLoading ? (
              <View>
                {Array.from({ length: 5 }).map((_, i) => (
                  <CallHistoryCardSkeleton key={i} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Feather name="phone-missed" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>Không tìm thấy lịch sử cuộc gọi phù hợp</Text>
              </View>
            )
          }
          ListFooterComponent={() =>
            historyQuery.isFetchingNextPage ? (
              <ActivityIndicator size="small" color={CRM_COLORS.primary} style={{ marginVertical: 16 }} />
            ) : items.length > 0 ? (
              <Text style={styles.footerCountText}>
                Hiển thị {items.length} trong tổng số {total} cuộc gọi
              </Text>
            ) : null
          }
        />
      </View>

      <CallHistoryFilterSheet ref={filterSheetRef} value={filters} onApply={setFilters} />

      <CallHistoryDetailSheet record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </View>
  );
};

export default CallHistoryTab;

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
