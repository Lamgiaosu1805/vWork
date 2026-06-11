import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import KpiCard from "../../components/hrm/leaveRequest/KpiCard";
import RequestCard from "../../components/hrm/leaveRequest/RequestCard";
import utils from "../../helpers/utils";
import { useSelector } from "react-redux";
import useGetStatisticsRequests from "../../hooks/requests/useGetStatisticsRequests";
import useGetMyRequests from "../../hooks/requests/useGetMyRequests";
import Header from "../../components/Header";
import { openDrawer } from "../../helpers/navigationRef";
import useCancelLeaveRequest from "../../hooks/requests/useCancelLeaveRequest";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

dayjs.extend(isBetween);

export default function RequestScreen({ navigation }) {
  const [requestStatus, setRequestStatus] = useState("pending");
  const [filterType] = useState("");
  const [fromFilter] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [toFilter] = useState(dayjs().format("YYYY-MM-DD"));
  const [page, setPage] = useState(1);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [cancelModal, setCancelModal] = useState({ visible: false, id: null });

  // Hooks
  const { data: stats, isLoading: statsLoading } = useGetStatisticsRequests();
  const { mutate: cancelRequest, isPending: isCancelling } =
    useCancelLeaveRequest();

  const {
    data: myRequestsData,
    isLoading: isLoadingRequests,
    refetch,
  } = useGetMyRequests({
    request_type: filterType,
    status: requestStatus,
    from: fromFilter,
    to: toFilter,
    page,
    limit: 5,
  });

  const myRequests = myRequestsData?.data ?? [];
  const totalPages = myRequestsData?.pagination?.total_pages ?? 1;
  const totalItems = myRequestsData?.pagination?.total ?? 0;

  const auth = useSelector((state) => state.auth);

  const confirmCancel = () => {
    if (!cancelModal.id) return;

    cancelRequest(cancelModal.id, {
      onSuccess: async () => {
        setCancelModal({ visible: false, id: null });

        Toast.show({
          type: "success",
          text1: "Thu hồi đơn thành công",
        });

        await refetch();
      },

      onError: (error) => {
        Toast.show({
          type: "error",
          text1: error?.response?.data?.message || "Thu hồi đơn thất bại",
        });
      },
    });
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <SafeAreaView edges={[]}>
        <Header
          title="Gửi yêu cầu"
          leftIconName="menu"
          onLeftPress={() => {
            openDrawer();
          }}
          rightIconName="add-sharp"
          onRightPress={() => navigation.navigate("AddRequestScreen")}
        />
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {utils.getGreeting(auth.user?.full_name, auth.user?.sex)}
          </Text>
          <Text style={styles.subtitle}>
            Tổng quan hệ thống quản lý nhân sự
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
        >
          <KpiCard
            icon="finger-print"
            colorIcon={"#4F46E5"}
            title="Lượt quên chấm công"
            value={statsLoading ? "--" : stats?.missed_clock_days}
            unit="ngày"
            note="Thử việc chưa được cấp lượt quên công."
            noteColor="#EAB308"
          />
          <KpiCard
            icon="calendar-outline"
            colorIcon={"#0369A1"}
            title="Ngày phép tích lũy"
            value={statsLoading ? "--" : stats?.leave_balance}
            unit="ngày"
            note="Tự động mở khóa 3 lượt quên công."
            noteColor="#EAB308"
          />
          <KpiCard
            icon="alert-circle-outline"
            colorIcon={"#E11D48"}
            title="Ngày nghỉ không phép"
            value={statsLoading ? "--" : stats?.absent_days}
            unit="ngày"
            note="Số ngày bạn bị phạt"
            noteColor={"#EF4444"}
          />
        </ScrollView>

        <View style={[styles.card, { padding: 0, overflow: "hidden" }]}>
          <View style={styles.tabRow}>
            {[
              { key: "pending", label: "Chờ Duyệt", dot: "#F59E0B" },
              { key: "approved", label: "Đã Duyệt", dot: "#22C55E" },
              { key: "rejected", label: "Từ Chối", dot: "#EF4444" },
            ].map((tab) => {
              const active = requestStatus === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => {
                    setRequestStatus(tab.key);
                    setPage(1);
                  }}
                >
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                  <View style={[styles.tabDot, { backgroundColor: tab.dot }]} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ padding: 12, gap: 8 }}>
            {isLoadingRequests ? (
              <ActivityIndicator
                style={{ marginVertical: 40 }}
                color={"#39C79A"}
              />
            ) : myRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-outline" size={40} color={"#9CA3AF"} />
                <Text style={{ color: "#9CA3AF", marginTop: 8 }}>
                  Không có dữ liệu
                </Text>
              </View>
            ) : (
              myRequests.map((item) => (
                <RequestCard
                  key={item._id}
                  item={item}
                  expanded={expandedRequestId === item._id}
                  onToggle={() =>
                    setExpandedRequestId((prev) =>
                      prev === item._id ? null : item._id,
                    )
                  }
                  onCancel={() =>
                    setCancelModal({ visible: true, id: item._id })
                  }
                  isCancelling={isCancelling}
                />
              ))
            )}
          </View>

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}
              >
                <Ionicons name="chevron-back" size={18} color={"#2A2A2A"} />
              </TouchableOpacity>
              <Text style={styles.pageInfo}>
                {page} / {totalPages} • {totalItems} đơn
              </Text>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={[
                  styles.pageBtn,
                  page === totalPages && { opacity: 0.4 },
                ]}
              >
                <Ionicons name="chevron-forward" size={18} color={"#2A2A2A"} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      <Modal
        visible={cancelModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModal({ visible: false, id: null })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCancelModal({ visible: false, id: null })}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Thu hồi đơn?</Text>
            <Text style={styles.modalDesc}>
              Đơn sẽ bị huỷ và không thể khôi phục lại.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setCancelModal({ visible: false, id: null })}
                style={styles.modalBtnSecondary}
              >
                <Text style={{ color: "#666", fontWeight: "600" }}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCancel}
                disabled={isCancelling}
                style={[
                  styles.modalBtnDanger,
                  isCancelling && { opacity: 0.6 },
                ]}
              >
                {isCancelling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Xác nhận
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FB" },

  // Header
  header: { padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 22, fontWeight: "700", color: "#2A2A2A" },
  subtitle: { marginTop: 4, fontSize: 14, color: "#9CA3AF", fontWeight: "500" },

  // KPI
  kpiRow: { paddingHorizontal: 10, paddingVertical: 8, gap: 12 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 10,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  // Tabs
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#39C79A" },
  tabText: { fontSize: 14, fontWeight: "700", color: "#9CA3AF" },
  tabTextActive: { color: "#39C79A" },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  emptyBox: { height: 150, alignItems: "center", justifyContent: "center" },

  // Pagination
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  pageInfo: { fontSize: 13, color: "#9CA3AF" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    width: 300,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2A2A",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 20,
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  modalBtnSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  modalBtnDanger: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
});
