import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { Skeleton } from "../../components/Skeleton";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMyPermissions } from "../../features/permission";
import {
  TICKET_DEFAULT_TAB,
  TICKET_EMPTY_STATES,
  TICKET_PRIMARY,
  TICKET_TABS,
} from "../../features/ticket/constants";
import TicketTabItem from "../../features/ticket/components/TicketTabItem";
import TicketCard from "../../features/ticket/components/TicketCard";
import TicketFilterSheet, {
  EMPTY_TICKET_FILTERS,
  countTicketFilters,
} from "../../features/ticket/components/TicketFilterSheet";
import useRefetchStaleOnFocus from "../../features/ticket/hooks/useRefetchStaleOnFocus";
import useTicketCounts from "../../features/ticket/hooks/useTicketCounts";
import useTicketMeta from "../../features/ticket/hooks/useTicketMeta";
import useTickets from "../../features/ticket/hooks/useTickets";
import { toIsoDate } from "../../features/ticket/lib/ticketFormat";

const chipsOf = (tab) => TICKET_TABS.find((item) => item.value === tab)?.chips ?? [];
const defaultScopeOf = (tab) => chipsOf(tab)[0]?.scope;

// Backend nhận status dạng "a,b" — axios gửi mảng thành status[]=a nên phải nối chuỗi
const buildParams = (tab, scope, q, filters) => ({
  tab,
  scope,
  q: q || undefined,
  status: filters.status.length ? filters.status.join(",") : undefined,
  urgency: filters.urgency || undefined,
  productId: filters.productId || undefined,
  categoryId: filters.categoryId || undefined,
  ownerId: filters.owner[0]?.id,
  from: filters.from ? toIsoDate(filters.from) : undefined,
  to: filters.to ? toIsoDate(filters.to).replace("T00:00:00", "T23:59:59.999") : undefined,
});

const TICKET_QUERY_KEYS = [["tickets"], ["ticket-counts"]];
const ListSeparator = () => <View style={{ height: 10 }} />;
const keyOfTicket = (item) => item.id;

const TicketCardSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Skeleton width={120} height={14} />
      <Skeleton width={70} height={20} borderRadius={10} />
    </View>
    <Skeleton width="85%" height={16} />
    <Skeleton width="45%" height={12} />
    <Skeleton width="65%" height={12} />
  </View>
);

const TicketsScreen = () => {
  const [tab, setTab] = useState(TICKET_DEFAULT_TAB);
  const [scope, setScope] = useState(defaultScopeOf(TICKET_DEFAULT_TAB));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_TICKET_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const searchTimerRef = useRef(null);

  const { canAny } = useMyPermissions();
  const canCreate = canAny(["ticket.create"]);

  const { counts, refetch: refetchCounts } = useTicketCounts();
  const { meta } = useTicketMeta();
  const params = useMemo(
    () => buildParams(tab, scope, debouncedSearch.trim(), filters),
    [tab, scope, debouncedSearch, filters],
  );
  const {
    tickets,
    total,
    isLoading,
    isError,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isPlaceholderData,
  } = useTickets(params);

  useRefetchStaleOnFocus(TICKET_QUERY_KEYS);

  // Đổi tab / chip / bộ lọc: keepPreviousData giữ danh sách cũ trong lúc tải — làm mờ đi để không nhìn nhầm
  const switching = isPlaceholderData && !isLoading;

  const handleRefresh = () => {
    refetch();
    refetchCounts();
  };

  // Nhân viên thường không có hàng chờ nhận của cả công ty — chỉ hiện tab khi meta báo rõ canViewAll
  const canViewAll = meta?.me?.canViewAll === true;

  const visibleTabs = useMemo(() => {
    return canViewAll
      ? TICKET_TABS
      : TICKET_TABS.filter((item) => item.value !== "unclaimed");
  }, [canViewAll]);

  const chips = useMemo(() => chipsOf(tab), [tab]);
  const filterCount = countTicketFilters(filters);

  const handleTab = (next) => {
    setTab(next);
    setScope(defaultScopeOf(next));
  };

  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(text), 400);
  };

  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  useEffect(() => {
    if (!canViewAll && tab === "unclaimed") {
      setTab(TICKET_DEFAULT_TAB);
      setScope(defaultScopeOf(TICKET_DEFAULT_TAB));
    }
  }, [canViewAll, tab]);

  const openTicket = useCallback((ticket) => {
    Keyboard.dismiss();
    router.push({ pathname: "/tickets/[id]", params: { id: ticket.id } });
  }, []);

  const renderTicket = useCallback(
    ({ item }) => (
      <View style={switching && styles.switching}>
        <TicketCard ticket={item} onPress={switching ? undefined : openTicket} />
      </View>
    ),
    [switching, openTicket],
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={{ gap: 10 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <TicketCardSkeleton key={index} />
          ))}
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={34} color={TICKET_PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>Không tải được danh sách ticket</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const filtered = debouncedSearch.trim() || filterCount > 0;
    const empty = TICKET_EMPTY_STATES[tab] ?? TICKET_EMPTY_STATES.all;
    return (
      <View style={styles.emptyBox}>
        <View style={styles.emptyIcon}>
          <Ionicons name="file-tray-outline" size={34} color={TICKET_PRIMARY} />
        </View>
        <Text style={styles.emptyTitle}>
          {filtered ? "Không tìm thấy ticket phù hợp" : empty.title}
        </Text>
        <Text style={styles.emptyDesc}>
          {filtered ? "Thử đổi từ khoá hoặc bộ lọc." : empty.description}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F9" }} edges={[]}>
      <Header
        title="Ticket hỗ trợ"
        LeftIcon={ChevronLeft}
        onLeftPress={() => router.back()}
      />

      <View style={styles.topPanel}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={"#6B7280"} />
            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder="Tìm mã, tiêu đề, khách hàng…"
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.filterBtn}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#374151" />
            {filterCount > 0 && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        <FlatList
          style={{ flexGrow: 0, marginTop: 10 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          showsHorizontalScrollIndicator={false}
          horizontal
          data={visibleTabs}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TicketTabItem
              item={item}
              counts={counts}
              onSelect={() => handleTab(item.value)}
              isSelected={tab === item.value}
            />
          )}
        />

        {chips.length > 0 && (
          <FlatList
            style={{ flexGrow: 0, marginTop: 10 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
            showsHorizontalScrollIndicator={false}
            horizontal
            data={chips}
            keyExtractor={(item) => item.scope}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setScope(item.scope)}
                activeOpacity={0.7}
                style={[styles.scope, scope === item.scope && styles.scopeActive]}
              >
                <Text style={[styles.scopeText, scope === item.scope && styles.scopeTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <FlatList
        data={tickets}
        keyExtractor={keyOfTicket}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ListSeparator}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={9}
        removeClippedSubviews
        ListHeaderComponent={
          tickets.length > 0 ? (
            <View style={styles.listHeader}>
              <View style={styles.totalRow}>
                <Text style={styles.totalText}>{switching ? "Đang tải…" : `${total} ticket`}</Text>
                {switching && <ActivityIndicator size="small" color={TICKET_PRIMARY} />}
              </View>
              <Text style={styles.sortText}>Mới cập nhật ↓</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={TICKET_PRIMARY} style={{ marginVertical: 16 }} />
          ) : tickets.length > 0 && !hasNextPage ? (
            <Text style={styles.endText}>Đã hiển thị hết {total} ticket</Text>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            tintColor={TICKET_PRIMARY}
            colors={[TICKET_PRIMARY]}
          />
        }
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      />

      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => router.push("/tickets/create")}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.fabText}>Tạo ticket</Text>
        </TouchableOpacity>
      )}

      <TicketFilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        value={filters}
        onApply={setFilters}
        meta={meta}
      />
    </SafeAreaView>
  );
};

export default TicketsScreen;

const styles = StyleSheet.create({
  topPanel: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: { height: 46, flex: 1, fontSize: 14, color: "#111827" },
  filterBtn: {
    borderRadius: 12,
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TICKET_PRIMARY,
  },
  scope: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeActive: { backgroundColor: "#FFF3EE" },
  scopeText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  scopeTextActive: { color: "#BF360C" },
  listContent: { padding: 16, paddingTop: 12, paddingBottom: 110, flexGrow: 1 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  totalText: { fontSize: 13, fontWeight: "700", color: "#374151" },
  totalRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  switching: { opacity: 0.45 },
  sortText: { fontSize: 12, color: "#6B7280" },
  endText: { textAlign: "center", fontSize: 12, color: "#9CA3AF", paddingVertical: 16 },
  skeletonCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, gap: 10 },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF3EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1D26",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 40,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFF3EE",
  },
  retryText: { fontSize: 13, fontWeight: "700", color: "#BF360C" },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 32,
    height: 52,
    paddingLeft: 16,
    paddingRight: 20,
    borderRadius: 26,
    backgroundColor: TICKET_PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: TICKET_PRIMARY,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  fabText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
