import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import Header from "../../components/Header";
import { getAllCustomers } from "../../api/crm/customer";
import { useSelector } from "react-redux";
import { getPermissions } from "../../helpers/permissions";
import api from "../../api/axiosInstance";
import Toast from "react-native-toast-message";
import CustomerCard from "../../components/crm/customer/CustomerCard";
import { ChevronLeft } from "lucide-react-native";

const LIMIT = 5;
const PRIMARY = "#ED2E30";

// ── Modal gán / chuyển sale ────────────────────────────────────────────────

function AssignModal({ customer, onClose, onSuccess }) {
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);

  const isReassign = !!customer?.referred_by;

  const fetchUsers = useCallback(async (q = "") => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/user/getUsers", {
        params: { search: q, limit: 30, page: 1, module: "crm" },
        requiresAuth: true,
      });
      setUsers(res.data?.data ?? []);
    } catch {
      Toast.show({ type: "error", text1: "Không thể tải danh sách nhân viên" });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (customer) fetchUsers();
  }, [customer]);

  const handleSearchChange = (text) => {
    setUserSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(text), 400);
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      Toast.show({ type: "error", text1: "Vui lòng chọn sale phụ trách" });
      return;
    }
    if (isReassign && !reason.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập lý do chuyển sale" });
      return;
    }

    setSubmitting(true);
    try {
      if (isReassign) {
        await api.patch(
          `/customer/${customer._id}/reassign`,
          {
            sale_user_info_id: selectedUser._id,
            reason: reason.trim(),
            include_cif_hh: false,
            include_ekyc_hh: false,
          },
          { requiresAuth: true },
        );
        Toast.show({ type: "success", text1: "Chuyển sale thành công" });
      } else {
        await api.post(
          `/customer/${customer._id}/assign`,
          {
            sale_user_info_id: selectedUser._id,
          },
          { requiresAuth: true },
        );
        Toast.show({ type: "success", text1: "Phân khách thành công" });
      }
      onSuccess();
      onClose();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!customer) return null;

  const customerName = customer.identity?.full_name || customer.phone_number;
  const currentSaleName = customer.referred_by?.full_name;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isReassign ? "Chuyển sale phụ trách" : "Phân khách về cho sale"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Thông tin khách */}
            <View style={styles.infoBox}>
              <Text style={styles.infoName}>{customerName}</Text>
              <Text style={styles.infoPhone}>SĐT: {customer.phone_number}</Text>
              {currentSaleName && (
                <Text style={styles.infoSale}>
                  Sale hiện tại: {currentSaleName}
                </Text>
              )}
            </View>

            {/* Cảnh báo chuyển sale */}
            {isReassign && (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  ⚠️ Thao tác này sẽ đổi sale phụ trách. Hoa hồng đã ghi nhận
                  trước đó vẫn được giữ nguyên và mọi thay đổi đều có audit log.
                </Text>
              </View>
            )}

            {/* Tìm sale */}
            <Text style={styles.fieldLabel}>
              {isReassign ? "Sale mới phụ trách *" : "Chọn sale phụ trách *"}
            </Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={15} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={userSearch}
                onChangeText={handleSearchChange}
                placeholder="Tìm theo tên, mã NV..."
                placeholderTextColor="#9CA3AF"
              />
              {loadingUsers && (
                <ActivityIndicator size="small" color={PRIMARY} />
              )}
            </View>

            {/* Danh sách sale */}
            {users.length > 0 && (
              <View style={styles.userList}>
                {users.map((u) => {
                  const isSelected = selectedUser?._id === u._id;
                  return (
                    <TouchableOpacity
                      key={u._id}
                      style={[
                        styles.userItem,
                        isSelected && styles.userItemSelected,
                      ]}
                      onPress={() => setSelectedUser(u)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.userItemContent}>
                        <View
                          style={[
                            styles.userAvatar,
                            isSelected && { backgroundColor: PRIMARY },
                          ]}
                        >
                          <Text
                            style={[
                              styles.userAvatarText,
                              isSelected && { color: "#fff" },
                            ]}
                          >
                            {(u.full_name ||
                              u.username ||
                              "?")[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.userName,
                              isSelected && { color: PRIMARY },
                            ]}
                          >
                            {u.full_name || u.username}
                          </Text>
                          <Text style={styles.userMeta}>
                            {u.ma_nv ? `${u.ma_nv} · ` : ""}
                            {u.phone_number || ""}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={PRIMARY}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Lý do (chỉ khi chuyển sale) */}
            {isReassign && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                  Lý do chuyển sale *
                </Text>
                <TextInput
                  style={[styles.searchBox, styles.inputMulti]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Ví dụ: Khách thực tế do sale A chăm sóc, nhầm khi phân..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!selectedUser ||
                  (isReassign && !reason.trim()) ||
                  submitting) &&
                  styles.confirmBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                !selectedUser || (isReassign && !reason.trim()) || submitting
              }
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  {isReassign ? "Xác nhận chuyển sale" : "Xác nhận phân khách"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function AdminCustomerScreen() {
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);
  const perms = getPermissions(user);
  const canManageCustomers = perms.showCustomerAll;

  const [search, setSearch] = useState("");
  const [filterFunnel, setFilterFunnel] = useState([]);
  const [filterBehavior, setFilterBehavior] = useState([]);
  const [filterRole, setFilterRole] = useState([]);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterSales, setFilterSales] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [branches, setBranches] = useState([]);
  const [sales, setSales] = useState([]);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

  const debounceRef = useRef(null);
  const activeSearch = useRef("");

  const buildParams = (pg, searchVal) => {
    const params = { page: pg, limit: LIMIT };
    if (searchVal) params.search = searchVal;
    if (filterFunnel.length) params.funnel_status = filterFunnel.join(",");
    if (filterBehavior.length) params.behavior = filterBehavior.join(",");
    if (filterRole.length) params.role_type = filterRole.join(",");
    if (filterBranch) params.branch_id = filterBranch;
    if (filterSales.length) params.sale_ids = filterSales.join(",");
    if (fromDate) params.from_date = dayjs(fromDate).startOf("day").toISOString();
    if (toDate) params.to_date = dayjs(toDate).endOf("day").toISOString();
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

  useEffect(() => {
    fetchPage(1, activeSearch.current);
  }, [filterFunnel, filterBehavior, filterRole, filterBranch, filterSales, fromDate, toDate]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [branchResponse, saleResponse] = await Promise.all([
          api.get("/branch/getAll", { requiresAuth: true }),
          api.get("/user/getUsers", { requiresAuth: true, params: { page: 1, limit: 200, module: "crm" } }),
        ]);
        setBranches(branchResponse.data?.data || []);
        setSales(saleResponse.data?.data || []);
      } catch (error) {
        console.log("Không thể tải tùy chọn lọc khách hàng:", error.message);
      }
    };
    loadFilterOptions();
  }, []);

  const handleSearchChange = (text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      activeSearch.current = text;
      fetchPage(1, text);
    }, 400);
  };

  const renderItem = useCallback(
    ({ item }) => {
      const hasSale = !!item.referred_by;
      const canReassign = canManageCustomers && hasSale;
      const canAssign = !hasSale;

      const handleUnassign = () => Alert.alert(
        "Xóa phân công sale",
        `Gỡ ${item.referred_by?.full_name || "sale hiện tại"} khỏi khách hàng này?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa phân công",
            style: "destructive",
            onPress: async () => {
              try {
                await api.patch(`/customer/${item._id}/unassign-sale`, {}, { requiresAuth: true });
                Toast.show({ type: "success", text1: "Đã xóa phân công sale" });
                fetchPage(1, activeSearch.current, true);
              } catch (error) {
                Toast.show({ type: "error", text1: error?.response?.data?.message || "Có lỗi xảy ra" });
              }
            },
          },
        ],
      );

      return (
        <View>
          <CustomerCard
            row={item}
            onPress={() =>
              navigation.navigate("CustomerDetailScreen", {
                externalId: item.external_id,
                ma_nv: item?.referred_by?.ma_nv,
              })
            }
          />
          {(canAssign || canReassign) && <View style={styles.customerActions}>
            <TouchableOpacity style={[styles.assignBtn, canReassign && styles.reassignBtn]} onPress={() => setAssignTarget(item)} activeOpacity={0.8}>
              <Ionicons name={canReassign ? "swap-horizontal" : "person-add"} size={14} color={canReassign ? "#D97706" : "#fff"} />
              <Text style={[styles.assignBtnText, canReassign && styles.reassignBtnText]}>{canReassign ? "Chuyển sale" : "Phân khách"}</Text>
            </TouchableOpacity>
            {canReassign && <TouchableOpacity style={[styles.assignBtn, styles.unassignBtn]} onPress={handleUnassign}><Ionicons name="person-remove" size={14} color="#DC2626" /><Text style={styles.unassignBtnText}>Xóa phân công</Text></TouchableOpacity>}
          </View>}
        </View>
      );
    },
    [canManageCustomers],
  );

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Header
        title="Quản lý khách hàng"
        LeftIcon={ChevronLeft}
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 12 }}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPage(1, activeSearch.current, true)}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
      >
        <View style={{ width: "100%", marginTop: 8 }}>
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

            <MultiSelect style={styles.dropdown} containerStyle={styles.dropdownContainer} selectedTextStyle={styles.selectedText} placeholderStyle={styles.selectedText} data={[{ value: "not_kyc", label: "Chưa eKYC" }, { value: "kyc_verified_no_investment", label: "Đã eKYC, chưa đầu tư" }, { value: "active_investor", label: "Đang đầu tư" }, { value: "settled", label: "Đã tất toán" }]} labelField="label" valueField="value" placeholder="Tất cả phễu trạng thái" value={filterFunnel} onChange={setFilterFunnel} selectedStyle={styles.selectedStyle} />
            <View style={styles.filtersRow}>
              <MultiSelect style={styles.dropdown} containerStyle={styles.dropdownContainer} selectedTextStyle={styles.selectedText} placeholderStyle={styles.selectedText} data={[{ value: "upsale", label: "Up-sale" }, { value: "cross_sale", label: "Cross-sale" }]} labelField="label" valueField="value" placeholder="Tất cả hành vi" value={filterBehavior} onChange={setFilterBehavior} selectedStyle={styles.selectedStyle} />
              <MultiSelect style={styles.dropdown} containerStyle={styles.dropdownContainer} selectedTextStyle={styles.selectedText} placeholderStyle={styles.selectedText} data={[{ value: "collaborator", label: "CTV" }, { value: "agent", label: "Đại lý" }]} labelField="label" valueField="value" placeholder="Tất cả vai trò" value={filterRole} onChange={setFilterRole} selectedStyle={styles.selectedStyle} />
            </View>
            <View style={styles.filtersRow}>
              <Dropdown style={styles.dropdown} containerStyle={styles.dropdownContainer} selectedTextStyle={styles.selectedText} placeholderStyle={styles.selectedText} data={[{ _id: "", branch_name: "Tất cả chi nhánh" }, ...branches]} labelField="branch_name" valueField="_id" value={filterBranch} placeholder="Tất cả chi nhánh" onChange={(item) => setFilterBranch(item._id)} />
              <MultiSelect style={styles.dropdown} containerStyle={styles.dropdownContainer} selectedTextStyle={styles.selectedText} placeholderStyle={styles.selectedText} data={sales} labelField="full_name" valueField="_id" placeholder="Tất cả sale" value={filterSales} onChange={setFilterSales} selectedStyle={styles.selectedStyle} />
            </View>
            <TouchableOpacity style={styles.dateFilterButton} onPress={() => setShowDateFilter(true)}><Ionicons name="calendar-outline" size={16} color="#4B5563" /><Text style={styles.dateFilterText}>{fromDate && toDate ? `${dayjs(fromDate).format("DD/MM/YYYY")} - ${dayjs(toDate).format("DD/MM/YYYY")}` : "Tất cả ngày"}</Text>{fromDate && <TouchableOpacity onPress={() => { setFromDate(null); setToDate(null); }}><Ionicons name="close-circle" size={18} color="#9CA3AF" /></TouchableOpacity>}</TouchableOpacity>
          </View>
        </View>

        <Text style={styles.listHeaderText}>
          Danh sách khách hàng ({total})
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => item._id}
            onEndReached={() => {
              if (!loadingMore && !loading && page < totalPages)
                fetchPage(page + 1, activeSearch.current);
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={() =>
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={PRIMARY} />
                </View>
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyWrap}>
                <Feather name="users" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>Không tìm thấy khách hàng</Text>
              </View>
            )}
          />
        )}
      </ScrollView>

      {assignTarget && (
        <AssignModal
          customer={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSuccess={() => fetchPage(1, activeSearch.current, true)}
        />
      )}
      <Modal visible={showDateFilter} transparent animationType="fade" onRequestClose={() => setShowDateFilter(false)}>
        <View style={styles.dateOverlay}><View style={styles.dateBox}><Text style={styles.modalTitle}>Lọc theo ngày</Text><Text style={styles.fieldLabel}>Từ ngày</Text><DateTimePicker value={fromDate || dayjs().startOf("month").toDate()} mode="date" onChange={(_, date) => date && setFromDate(date)} /><Text style={styles.fieldLabel}>Đến ngày</Text><DateTimePicker value={toDate || new Date()} mode="date" maximumDate={new Date()} onChange={(_, date) => date && setToDate(date)} />{fromDate && toDate && fromDate > toDate && <Text style={styles.errorDate}>Ngày bắt đầu không được lớn hơn ngày kết thúc</Text>}<TouchableOpacity disabled={fromDate && toDate && fromDate > toDate} style={styles.confirmDate} onPress={() => setShowDateFilter(false)}><Text style={styles.confirmBtnText}>Áp dụng</Text></TouchableOpacity></View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%" },
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
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", height: 40 },
  filtersRow: { flexDirection: "row", gap: 8 },
  selectedText: { fontSize: 12, color: "#374151" },
  selectedStyle: { borderRadius: 12 },
  dateFilterButton: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 10 },
  dateFilterText: { flex: 1, fontSize: 12, color: "#4B5563" },
  listHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  footerLoader: { paddingVertical: 16, alignItems: "center" },
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
  dropdownContainer: { borderRadius: 8 },

  // Assign buttons
  assignBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 0,
    marginTop: -6,
    marginBottom: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: PRIMARY,
  },
  assignBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  reassignBtn: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  reassignBtnText: { color: "#D97706" },
  customerActions: { flexDirection: "row", gap: 8 },
  unassignBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  unassignBtnText: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
  dateOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,.45)", justifyContent: "center", padding: 20 },
  dateBox: { backgroundColor: "#fff", borderRadius: 18, padding: 18 },
  errorDate: { color: "#DC2626", fontSize: 12, marginTop: 8 },
  confirmDate: { backgroundColor: PRIMARY, paddingVertical: 12, alignItems: "center", borderRadius: 10, marginTop: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  closeBtn: { padding: 4 },
  modalScroll: { paddingHorizontal: 20, paddingTop: 16 },

  infoBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
  },
  infoPhone: { fontSize: 13, color: "#6B7280" },
  infoSale: { fontSize: 13, color: "#6B7280", marginTop: 3 },

  warnBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  warnText: { fontSize: 12, color: "#C2410C", lineHeight: 18 },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  inputMulti: {
    alignItems: "flex-start",
    minHeight: 80,
    paddingTop: 10,
    flexDirection: "column",
  },

  userList: { gap: 6, marginBottom: 8 },
  userItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  userItemSelected: { borderColor: PRIMARY, backgroundColor: "#FFF0F0" },
  userItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  userName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  userMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
