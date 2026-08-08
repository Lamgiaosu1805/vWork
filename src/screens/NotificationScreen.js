import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommonActions } from "@react-navigation/native";
import { Bell, ChevronLeft, CheckCheck } from "lucide-react-native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import Header from "../components/Header";
import { COLORS } from "../assets/theme/colors";
import { navigationRef } from "../helpers/navigationRef";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInfinite,
  useUnreadCount,
} from "../hooks/notification/useNotifications";

dayjs.extend(relativeTime);
dayjs.locale("vi");

// Dùng navigationRef (ref gốc) thay vì `navigation` prop của NotificationScreen vì
// bước 1 xóa hẳn lịch sử cũ nên `navigation` prop của màn Notification không còn hợp lệ
// cho lệnh điều hướng thứ 2 ở bước sau (giống cách fcmConfig.js xử lý deep link chat).
//
// Reset thẳng về HRMBottomTab (Chấm công) làm gốc duy nhất, xóa sạch lịch sử cũ
// (Workplace/CRM/Notification...), để hành vi back luôn chắc chắn quay về đây.
const resetToHRMHome = () => {
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: "RootDrawer",
          state: {
            routes: [
              {
                name: "HRMStackNavigator",
                state: { routes: [{ name: "HRMBottomTab" }] },
              },
            ],
          },
        },
      ],
    }),
  );
};

const goToMyRequest = (requestId) => {
  if (!navigationRef.isReady()) return;

  resetToHRMHome();

  setTimeout(() => {
    navigationRef.navigate("RootDrawer", {
      screen: "HRMStackNavigator",
      params: {
        screen: "HRMBottomTab",
        params: { screen: "RequestScreen", params: { requestId } },
      },
    });
  }, 50);
};

const goToApproval = (requestId) => {
  if (!navigationRef.isReady()) return;

  resetToHRMHome();

  setTimeout(() => {
    navigationRef.navigate("RootDrawer", {
      screen: "HRMStackNavigator",
      params: {
        screen: "ApprovalRequestScreen",
        params: { requestId },
      },
    });
  }, 50);
};

const goToRequestNotification = (item) => {
  if (item.type?.endsWith("_created")) {
    goToApproval(item.ref_id);
  } else {
    goToMyRequest(item.ref_id);
  }
};

const NotificationItem = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.item, !item.is_read && styles.itemUnread]}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={[styles.iconWrap, !item.is_read && styles.iconWrapUnread]}>
      <Bell
        size={20}
        color={item.is_read ? COLORS.neutral.neutral500 : COLORS.Primary}
      />
    </View>

    <View style={styles.itemContent}>
      <Text
        style={[styles.itemTitle, !item.is_read && styles.itemTitleUnread]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      {!!item.body && (
        <Text style={styles.itemBody} numberOfLines={2}>
          {item.body}
        </Text>
      )}
      <Text style={[styles.itemTime, !item.is_read && styles.itemTimeUnread]}>
        {dayjs(item.createdAt).fromNow()}
      </Text>
    </View>

    {!item.is_read && <View style={styles.unreadDot} />}
  </TouchableOpacity>
);

const NotificationScreen = ({ navigation }) => {
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotificationsInfinite();
  const unreadCount = useUnreadCount();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const notifications = data?.pages.flatMap((p) => p?.data ?? []) ?? [];

  const handlePress = (item) => {
    if (!item.is_read) markRead(item._id);
    if (item.ref_type === "request" && item.ref_id) {
      goToRequestNotification(item);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <Header
        title="Thông báo"
        LeftIcon={ChevronLeft}
        onLeftPress={() => navigation.goBack()}
        RightIcon={unreadCount > 0 ? CheckCheck : undefined}
        onRightPress={() => !isMarkingAll && markAllRead()}
      />

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={COLORS.Primary}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={() => handlePress(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Bell size={28} color={COLORS.neutral.neutral400} />
              </View>
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptySubtitle}>
                Khi có thông báo mới, chúng sẽ hiển thị ở đây.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                style={{ paddingVertical: 16 }}
                color={COLORS.Primary}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  list: { paddingVertical: 8 },
  emptyList: { flexGrow: 1 },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemUnread: { backgroundColor: `${COLORS.Primary}0D` },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.neutral.neutral100,
  },
  iconWrapUnread: { backgroundColor: `${COLORS.Primary}1A` },
  itemContent: { flex: 1 },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text.dark,
    lineHeight: 20,
  },
  itemTitleUnread: { fontWeight: "700" },
  itemBody: {
    fontSize: 13,
    color: COLORS.text.bland,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 12,
    color: COLORS.neutral.neutral400,
    marginTop: 4,
  },
  itemTimeUnread: { color: COLORS.Primary, fontWeight: "600" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.Primary,
    marginTop: 6,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.neutral.neutral100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text.dark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.text.bland,
    marginTop: 4,
    textAlign: "center",
  },
});

export default NotificationScreen;
