import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import dayjs from "dayjs";
import Header from "../../components/Header";
import useGetRequests from "../../hooks/requests/useGetRequests";
import { FILTER_ITEMS, TABS } from "../../constants/hrm";
import ConfirmModal from "../../components/hrm/approvalRequest/ConfirmModal";
import RequestApprovalCard from "../../components/hrm/approvalRequest/RequestApprovalCard";
import useReviewRequest from "../../hooks/requests/useReviewRequest";
import Toast from "react-native-toast-message";
import DatePickerApprovalModal from "../../components/hrm/approvalRequest/DatePickerApprovalModal";

const ApprovalRequestScreen = ({ navigation }) => {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [requestType, setRequestType] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    id: null,
    action: null,
  });
  const [isTyping, setIsTyping] = useState(false);

  const { data, isLoading, refetch } = useGetRequests({
    request_type: requestType,
    status,
    page,
    limit: 6,
    search,
    from,
    to,
  });

  const { mutate: handleRequest, isPending: isReviewing } = useReviewRequest();

  const responseData = Array.isArray(data) ? { data, pagination: {} } : data;
  const requests = responseData?.data ?? [];
  const total = responseData?.pagination?.total ?? 0;
  const totalPages = responseData?.pagination?.total_pages ?? 1;

  const resetPage = () => setPage(1);

  const onRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setFrom("");
    setTo("");
    setRequestType("");
    setStatus("");
    setPage(1);
  };

  const hasActiveFilter = search || from || to || requestType;

  useEffect(() => {
    setIsTyping(true);

    const timeout = setTimeout(() => {
      const keyword = searchInput.trim();

      setSearch((prev) => {
        if (prev !== keyword) {
          setPage(1);
        }

        return keyword;
      });

      setIsTyping(false);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchInput]);

  const openConfirm = (id, action) =>
    setConfirmModal({ visible: true, id, action });
  const closeConfirm = () =>
    setConfirmModal({ visible: false, id: null, action: null });

  const onConfirm = () => {
    handleRequest(
      confirmModal.id,
      { action: confirmModal.action, reviewer_note: "" },
      {
        onSuccess: () => {
          refetch();
          closeConfirm();
          Toast.show({
            type: "success",
            text1:
              confirmModal.action === "approve"
                ? "Đã duyệt yêu cầu thành công"
                : "Đã từ chối yêu cầu",
          });
        },
        onError: (error) => {
          Toast.show({
            type: "error",
            text1: error?.response?.data?.message || "Đã có lỗi xảy ra",
          });
        },
      },
    );
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Xử lý yêu cầu"
        leftIconName="chevron-back-outline"
        onLeftPress={() => navigation.goBack()}
      />

      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          {isTyping ? (
            <Ionicons name="pencil" size={16} color="#9CA3AF" />
          ) : (
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          )}
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên, mã NV..."
            placeholderTextColor="#9CA3AF"
            value={searchInput}
            onChangeText={setSearchInput}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchInput("");
                setSearch("");
                resetPage();
              }}
            >
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <Dropdown
          style={styles.filterDropdown}
          placeholderStyle={{ fontSize: 12, color: "#9CA3AF" }}
          selectedTextStyle={{ fontSize: 12, color: "#111827" }}
          itemTextStyle={{ fontSize: 13, color: "#111827" }}
          activeColor="rgba(37,99,235,0.08)"
          data={FILTER_ITEMS}
          labelField="label"
          valueField="value"
          placeholder="Loại đơn"
          value={requestType}
          onChange={(item) => {
            setRequestType(item.value);
            resetPage();
          }}
          renderRightIcon={() => (
            <Ionicons name="chevron-down" size={13} color="#9CA3AF" />
          )}
        />
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowFromPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={[styles.datePickerText, !from && { color: "#9CA3AF" }]}>
            {from ? dayjs(from).format("DD/MM/YYYY") : "Từ ngày"}
          </Text>
          {from && (
            <TouchableOpacity
              onPress={() => {
                setFrom("");
                resetPage();
              }}
            >
              <Ionicons name="close-circle" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <Ionicons name="arrow-forward" size={14} color="#D1D5DB" />

        {/* Đến ngày */}
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowToPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={[styles.datePickerText, !to && { color: "#9CA3AF" }]}>
            {to ? dayjs(to).format("DD/MM/YYYY") : "Đến ngày"}
          </Text>
          {to && (
            <TouchableOpacity
              onPress={() => {
                setTo("");
                resetPage();
              }}
            >
              <Ionicons name="close-circle" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {hasActiveFilter && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
            <Ionicons name="refresh-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map((tab) => {
            const active = status === tab.key;
            const count = active ? total : null;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => {
                  setStatus(tab.key);
                  resetPage();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {count !== null && (
                  <View
                    style={[styles.tabCount, active && styles.tabCountActive]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        active && styles.tabCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
                <View style={[styles.tabDot, { backgroundColor: tab.dot }]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="document-outline" size={52} color="#9CA3AF" />
          <Text style={styles.emptyText}>Không có dữ liệu</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <RequestApprovalCard
              item={item}
              onApprove={(id) => openConfirm(id, "approve")}
              onReject={(id) => openConfirm(id, "reject")}
              isReviewing={isReviewing}
            />
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}
                >
                  <Ionicons name="chevron-back" size={18} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  {page} / {totalPages} • {total} đơn
                </Text>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={[
                    styles.pageBtn,
                    page === totalPages && { opacity: 0.4 },
                  ]}
                >
                  <Ionicons name="chevron-forward" size={18} color="#111827" />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      <ConfirmModal
        visible={confirmModal.visible}
        action={confirmModal.action}
        onConfirm={onConfirm}
        onCancel={closeConfirm}
        isLoading={isReviewing}
      />

      <DatePickerApprovalModal
        visible={showFromPicker}
        value={from}
        title="Chọn ngày bắt đầu"
        onConfirm={(val) => {
          setFrom(val);
          resetPage();
        }}
        onClose={() => setShowFromPicker(false)}
      />

      <DatePickerApprovalModal
        visible={showToPicker}
        value={to}
        title="Chọn ngày kết thúc"
        onConfirm={(val) => {
          setTo(val);
          resetPage();
        }}
        onClose={() => setShowToPicker(false)}
      />

      <Toast />
    </View>
  );
};

export default ApprovalRequestScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FB" },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    padding: 0,
  },
  filterDropdown: {
    width: 120,
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
  },
  datePickerText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },

  tabContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabScroll: { paddingHorizontal: 16, gap: 4 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#2563EB" },
  tabText: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  tabTextActive: { color: "#2563EB" },
  tabCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  tabCountActive: { backgroundColor: "#DBEAFE" },
  tabCountText: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  tabCountTextActive: { color: "#2563EB" },
  tabDot: { width: 6, height: 6, borderRadius: 3 },

  listContent: { padding: 12, gap: 10 },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 4,
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 16,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  pageInfo: { fontSize: 13, color: "#9CA3AF" },
});
