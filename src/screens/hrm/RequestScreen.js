import React, { useCallback, useEffect, useRef, useState } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  LinearTransition,
} from "react-native-reanimated";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import KpiCard from "../../components/hrm/leaveRequest/KpiCard";
import RequestCard from "../../components/hrm/leaveRequest/RequestCard";
import RequestDetailBottomSheet from "../../components/hrm/leaveRequest/RequestDetailBottomSheet";
import utils from "../../helpers/utils";
import { useSelector } from "react-redux";
import useGetStatisticsRequests from "../../hooks/requests/useGetStatisticsRequests";
import useGetMyRequestsInfinite from "../../hooks/requests/useGetMyRequestsInfinite";
import useGetRequestById from "../../hooks/requests/useGetRequestById";
import { openDrawer } from "../../helpers/navigationRef";
import { getPermissions } from "../../helpers/permissions";
import useCancelLeaveRequest from "../../hooks/requests/useCancelLeaveRequest";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { Menu, FileEdit, ClipboardCheck } from "lucide-react-native";
import useTheme from "../../assets/theme/useTheme";
import { COLORS } from "../../assets/theme/colors";

dayjs.extend(isBetween);

const TABS = [
  { key: "pending", label: "Chờ Duyệt", dot: "#F59E0B" },
  { key: "approved", label: "Đã Duyệt", dot: "#22C55E" },
  { key: "rejected", label: "Từ Chối", dot: "#EF4444" },
];
const TAB_PAD = 4;
const TAB_GAP = 4;

export default function RequestScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [requestStatus, setRequestStatus] = useState("pending");
  const [filterType] = useState("");
  const [fromFilter] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [toFilter] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancelModal, setCancelModal] = useState({ visible: false, id: null });
  const detailSheetRef = useRef(null);

  const openDetail = (item) => {
    setSelectedRequest(item);
    detailSheetRef.current?.present();
  };

  // Hooks
  const { data: stats, isLoading: statsLoading } = useGetStatisticsRequests();
  const { mutate: cancelRequest, isPending: isCancelling } =
    useCancelLeaveRequest();

  const {
    data: infiniteData,
    isLoading: isLoadingRequests,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetMyRequestsInfinite({
    request_type: filterType,
    status: requestStatus,
    from: fromFilter,
    to: toFilter,
    limit: 5,
  });

  const myRequests = infiniteData?.pages.flatMap((p) => p.data ?? []) ?? [];
  const totalItems = infiniteData?.pages?.[0]?.pagination?.total ?? 0;

  const handleScroll = ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distanceToBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceToBottom < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const auth = useSelector((state) => state.auth);
  const perms = getPermissions(auth.user);
  const canOpenApproval = perms.canReviewRequests || perms.canViewAllRequests;

  // Segmented tab pill
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const tabW = tabRowWidth
    ? (tabRowWidth - TAB_PAD * 2 - TAB_GAP * (TABS.length - 1)) / TABS.length
    : 0;
  const pillX = useSharedValue(0);
  const activeTabIndex = TABS.findIndex((t) => t.key === requestStatus);

  useEffect(() => {
    if (!tabW) return;
    pillX.value = withSpring(activeTabIndex * (tabW + TAB_GAP), {
      damping: 18,
      stiffness: 170,
      mass: 0.9,
    });
  }, [activeTabIndex, tabW]);

  const pillStyle = useAnimatedStyle(() => ({
    width: tabW,
    transform: [{ translateX: pillX.value }],
  }));

  const changeTab = (key) => {
    setRequestStatus(key);
  };

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

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useFocusEffect(
    useCallback(() => {
      refetchRef.current();
    }, []),
  );

  // Mở chi tiết đơn khi được điều hướng tới từ màn hình thông báo
  const linkedRequestId = route?.params?.requestId;
  const { data: linkedRequest } = useGetRequestById(linkedRequestId);

  useEffect(() => {
    if (!linkedRequest) return;
    openDetail(linkedRequest);
    navigation.setParams({ requestId: undefined });
  }, [linkedRequest]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.main }]}>
      <LinearGradient
        colors={[COLORS.Primary, COLORS.Secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            onPress={() => openDrawer()}
            style={styles.heroIconBtn}
          >
            <Menu size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.heroHeaderTitle}>Yêu cầu</Text>
          {canOpenApproval ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("ApprovalRequestScreen")}
              style={styles.heroIconBtn}
            >
              <ClipboardCheck size={22} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.heroIconBtn} />
          )}
        </View>

        <Text style={styles.heroGreeting}>
          Xin chào{auth.user?.full_name ? `, ${auth.user.full_name}` : ""} 👋
        </Text>
        <Text style={styles.heroSubtitle}>
          Gửi và theo dõi yêu cầu nhân sự nhanh chóng, minh bạch.
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ marginTop: -26 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("AddRequestScreen")}
          // activeOpacity={0.85}
          style={styles.ctaPill}
        >
          <View style={styles.ctaIconWrap}>
            <FileEdit size={18} color={COLORS.Primary} />
          </View>
          <Text style={styles.ctaText}>Tạo yêu cầu mới</Text>
        </TouchableOpacity>

        <View style={styles.kpiRow}>
          <KpiCard
            icon="finger-print"
            colorIcon={"#4F46E5"}
            title="Lượt quên chấm công"
            value={statsLoading ? "--" : stats?.missed_clock_days}
            unit="ngày"
          />
          <KpiCard
            icon="calendar-outline"
            colorIcon={"#0369A1"}
            title="Ngày phép tích lũy"
            value={statsLoading ? "--" : stats?.leave_balance}
            unit="ngày"
          />
          <KpiCard
            icon="alert-circle-outline"
            colorIcon={"#E11D48"}
            title="Ngày nghỉ không phép"
            value={statsLoading ? "--" : stats?.absent_days}
            unit="ngày"
          />
        </View>

        <View style={[styles.card, { padding: 0, overflow: "hidden" }]}>
          <View
            style={styles.tabRow}
            onLayout={(e) => setTabRowWidth(e.nativeEvent.layout.width)}
          >
            {tabRowWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[styles.tabPill, pillStyle]}
              />
            )}

            {/* {isLoadingRequests && (
              <ActivityIndicator
                size="small"
                color={COLORS.Primary}
                style={styles.tabLoadingIndicator}
              />
            )} */}

            {TABS.map((tab) => {
              const active = requestStatus === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tab}
                  activeOpacity={0.8}
                  onPress={() => changeTab(tab.key)}
                >
                  <View style={[styles.tabDot, { backgroundColor: tab.dot }]} />
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Animated.View layout={LinearTransition.duration(250)}>
            <View style={{ padding: 12, gap: 8 }}>
              {isLoadingRequests ? (
                <ActivityIndicator
                  style={{ marginVertical: 40 }}
                  color={COLORS.Primary}
                />
              ) : myRequests.length === 0 ? (
                <View style={styles.emptyBox}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons
                      name="document-outline"
                      size={32}
                      color={COLORS.neutral.neutral400}
                    />
                  </View>
                  <Text style={styles.emptyText}>Không có dữ liệu</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {myRequests.map((item) => (
                    <Animated.View
                      key={item._id}
                      layout={LinearTransition.duration(200)}
                    >
                      <RequestCard
                        item={item}
                        onPress={() => openDetail(item)}
                        onCancel={() =>
                          setCancelModal({ visible: true, id: item._id })
                        }
                        isCancelling={isCancelling}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>

            {isFetchingNextPage && (
              <View style={styles.loadMoreRow}>
                <ActivityIndicator size="small" color={COLORS.Primary} />
              </View>
            )}

            {!hasNextPage && myRequests.length > 0 && (
              <Text style={styles.endOfListText}>
                Đã hiển thị tất cả {totalItems} đơn
              </Text>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <RequestDetailBottomSheet
        ref={detailSheetRef}
        item={selectedRequest}
        isCancelling={isCancelling}
        onCancel={() => {
          detailSheetRef.current?.dismiss();
          setCancelModal({ visible: true, id: selectedRequest?._id });
        }}
      />

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
            <View style={styles.modalIconWrap}>
              <Ionicons name="alert-circle" size={30} color={COLORS.error.error600} />
            </View>
            <Text style={styles.modalTitle}>Thu hồi đơn?</Text>
            <Text style={styles.modalDesc}>
              Đơn sẽ bị huỷ và không thể khôi phục lại.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setCancelModal({ visible: false, id: null })}
                style={styles.modalBtnSecondary}
              >
                <Text style={{ color: COLORS.text.dark, fontWeight: "600" }}>
                  Đóng
                </Text>
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 44,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  heroHeaderTitle: { color: COLORS.white, fontWeight: "700", fontSize: 17 },
  heroGreeting: {
    marginTop: 18,
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 20,
  },
  heroSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
    fontSize: 13,
  },

  // KPI
  kpiRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },

  // CTA
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ctaIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: `${COLORS.Primary}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: COLORS.Primary, fontWeight: "700", fontSize: 15 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    margin: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.neutral.neutral200,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  // Tabs
  tabRow: {
    flexDirection: "row",
    position: "relative",
    backgroundColor: COLORS.neutral.neutral100,
    margin: 10,
    padding: TAB_PAD,
    borderRadius: 14,
    gap: TAB_GAP,
  },
  tabPill: {
    position: "absolute",
    top: TAB_PAD,
    bottom: TAB_PAD,
    left: TAB_PAD,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabLoadingIndicator: {
    position: "absolute",
    top: TAB_PAD,
    right: -6,
  },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.text.bland },
  tabTextActive: { color: COLORS.text.dark },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  emptyBox: { paddingVertical: 32, alignItems: "center", justifyContent: "center" },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.neutral.neutral100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyText: { color: COLORS.text.bland, fontSize: 13, fontWeight: "500" },

  // Infinite loading footer
  loadMoreRow: { paddingVertical: 16, alignItems: "center" },
  endOfListText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.neutral.neutral400,
    paddingVertical: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: 300,
    alignItems: "center",
    elevation: 8,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.error.error50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.dark,
    marginBottom: 6,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    color: COLORS.text.bland,
    lineHeight: 20,
    marginBottom: 18,
    textAlign: "center",
  },
  modalActions: { flexDirection: "row", justifyContent: "center", gap: 10, width: "100%" },
  modalBtnSecondary: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.neutral.neutral100,
  },
  modalBtnDanger: {
    flex: 1,
    backgroundColor: COLORS.error.error600,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
});
