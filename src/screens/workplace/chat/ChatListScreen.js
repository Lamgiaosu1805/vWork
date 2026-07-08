import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import chatApi from "../../../api/chat";
import { connectChatSocket } from "../../../libs/chatSocket";
import {
  setConversations,
  setLoadingConversations,
  upsertConversation,
} from "../../../redux/slice/chatSlice";
import Header from "../../../components/Header";
import { openDrawer } from "../../../helpers/navigationRef";
import {
  getCurrentUserKeys,
  isCurrentUser,
  resolveConversationId,
} from "../../../utils/chatUtils";
import ConversationRow from "../../../components/workplace/chat/ConversationRow";
import { HEIGHT_SHEET } from "../../crm/CustomerScreen";
import { useSharedValue, withTiming } from "react-native-reanimated";
import NewConversationBottomSheet from "../../../components/workplace/chat/NewConversationBottomSheet";
import { Menu, Send } from "lucide-react-native";
import ConnectionStatusBar from "../../../components/workplace/chat/ConnectionStatusBar";
import useSocketStatus from "../../../hooks/workplace/useSocketStatus";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function ChatListScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const conversations = useSelector((state) => state.chat.conversations);
  const loading = useSelector((state) => state.chat.loadingConversations);
  const currentUserKeys = useMemo(() => getCurrentUserKeys(user), [user]);
  const currentUserInfoId = useMemo(
    () => user?._id ?? user?.id ?? null,
    [user],
  );
  const translateNewConversation = useSharedValue(HEIGHT_SHEET);

  const [tabSelected, setTabSelected] = useState("all");

  const socketStatus = useSocketStatus();

  const flatListRef = useRef(null);

  const handleSelectConversation = useCallback(
    async (item) => {
      try {
        // Group creation flow from NewConversationBottomSheet
        if (item?.type === "group" || Array.isArray(item?.members)) {
          const members = item.members;
          const memberIds = members
            .map((m) => m.id_account?._id)
            .filter(Boolean);

          if (!memberIds.length) {
            Toast.show({ type: "error", text1: "Không có thành viên" });
            return;
          }

          const res = await chatApi.createGroupConversation({
            name: item.name,
            members: memberIds,
          });
          const conversation = res?.data?.data;
          const conversationId = resolveConversationId(conversation);

          if (!conversationId) {
            Toast.show({
              type: "error",
              text1: "Không thể mở cuộc trò chuyện",
            });
            return;
          }

          navigation.navigate("ChatRoomScreen", {
            conversationId,
            conversation,
          });
          return;
        }

        // Private conversation flow
        const receiverId = item?.id_account?._id;

        if (!receiverId) {
          Toast.show({ type: "error", text1: "Không tìm thấy người nhận" });
          return;
        }

        const res = await chatApi.createPrivateConversation({
          receiver_id: receiverId,
        });
        const conversation = res?.data?.data;
        const conversationId = resolveConversationId(conversation);

        if (!conversationId) {
          Toast.show({ type: "error", text1: "Không thể mở cuộc trò chuyện" });
          return;
        }

        navigation.navigate("ChatRoomScreen", { conversationId, conversation });
      } catch (error) {
        Toast.show({
          type: "error",
          text1:
            error?.response?.data?.message ??
            error?.message ??
            "Không thể tạo cuộc trò chuyện",
        });
      }
    },
    [navigation],
  );

  const handleDeleteConversation = useCallback(
    (conversationId) => {
      if (!conversationId) return;
      const doDelete = async () => {
        try {
          await chatApi.deleteConversation(conversationId);
          dispatch({
            type: "chat/deleteConversation",
            payload: conversationId,
          });
          Toast.show({ type: "success", text1: "Đã xoá cuộc trò chuyện" });
        } catch (error) {
          Toast.show({
            type: "error",
            text1:
              error?.response?.data?.message ??
              error?.message ??
              "Xoá thất bại",
          });
        }
      };

      Alert.alert(
        "Xoá cuộc trò chuyện",
        "Bạn có chắc muốn xoá cuộc trò chuyện này?",
        [
          { text: "Huỷ", style: "cancel" },
          { text: "Xoá", style: "destructive", onPress: doDelete },
        ],
      );
    },
    [dispatch],
  );

  const openNewConversattion = () =>
    (translateNewConversation.value = withTiming(0));

  const loadConversations = useCallback(async () => {
    dispatch(setLoadingConversations(true));

    try {
      const res = await chatApi.getConversations();
      const items = res?.data?.data ?? res?.data ?? [];
      dispatch(setConversations(items));
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Không thể tải danh sách chat",
      });
    } finally {
      dispatch(setLoadingConversations(false));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let socket = null;

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
      });

      const handleConversationUpserted = (payload) => {
        const conversation = payload?.conversation ?? payload?.data ?? payload;
        if (conversation) dispatch(upsertConversation(conversation));
      };

      const handleMessageNew = (payload) => {
        const conversation =
          payload?.conversation ?? payload?.data?.conversation ?? null;
        const message =
          payload?.message ??
          payload?.data?.message ??
          payload?.data ??
          payload ??
          null;
        const conversationId =
          resolveConversationId(conversation) ??
          message?.conversationId ??
          payload?.conversationId ??
          null;

        if (conversation) {
          dispatch(upsertConversation(conversation));
          return;
        }

        if (conversationId) {
          dispatch(
            upsertConversation({ _id: conversationId, lastMessage: message }),
          );
        }
      };

      const handleSeen = (payload) => {
        const conversation =
          payload?.conversation ??
          payload?.data?.conversation ??
          payload?.data ??
          payload;
        if (conversation) dispatch(upsertConversation(conversation));
      };

      const bootstrap = async () => {
        socket = await connectChatSocket(accessToken);
        if (!active) return;

        if (socket) {
          socket.on("conversation:upserted", handleConversationUpserted);
          socket.on("message:new", handleMessageNew);
          socket.on("message:seen", handleSeen);
        }

        await loadConversations();
      };

      bootstrap();

      return () => {
        active = false;
        if (socket) {
          socket.off("conversation:upserted", handleConversationUpserted);
          socket.off("message:new", handleMessageNew);
          socket.off("message:seen", handleSeen);
        }
      };
    }, [accessToken, dispatch, loadConversations]),
  );

  const renderItem = ({ item }) => {
    const conversationId = resolveConversationId(item);
    if (!conversationId) return null;

    return (
      <ConversationRow
        item={item}
        currentUserKeys={currentUserKeys}
        currentUserInfoId={currentUserInfoId}
        onPress={() =>
          navigation.navigate("ChatRoomScreen", {
            conversationId,
            conversation: item,
          })
        }
        onDelete={handleDeleteConversation}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Tin nhắn"
        LeftIcon={Menu}
        onLeftPress={() => openDrawer()}
        RightIcon={Send}
        onRightPress={openNewConversattion}
      />

      <ConnectionStatusBar status={socketStatus} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          marginTop: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => setTabSelected("all")}
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "#F16733",
            backgroundColor: tabSelected === "all" ? "#F16733" : "#FFFFFF",
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
          activeOpacity={0.8}
        >
          <Text
            children="Tất cả"
            style={{
              color: tabSelected === "all" ? "#FFFFFF" : "#000000",
              fontSize: 14,
              fontWeight: "700",
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTabSelected("group")}
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "#F16733",
            backgroundColor: tabSelected === "group" ? "#F16733" : "#FFFFFF",
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
          }}
          activeOpacity={0.8}
        >
          <Text
            children="Nhóm"
            style={{
              color: tabSelected === "group" ? "#FFFFFF" : "#000000",
              fontSize: 14,
              fontWeight: "700",
            }}
          />
        </TouchableOpacity>
      </View>

      {loading && conversations.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0F766E" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={conversations.filter((c) =>
            tabSelected === "all" ? true : c?.type === "group",
          )}
          keyExtractor={(item, index) =>
            String(resolveConversationId(item) ?? index)
          }
          renderItem={renderItem}
          contentContainerStyle={
            conversations.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadConversations}
              tintColor="#0F766E"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={40}
                color="#9CA3AF"
              />
              <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện</Text>
              <Text style={styles.emptyText}>
                Khi có tin nhắn mới, danh sách sẽ tự cập nhật theo realtime.
              </Text>
            </View>
          }
        />
      )}

      <NewConversationBottomSheet
        translateNewConversation={translateNewConversation}
        onSelect={handleSelectConversation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  list: { padding: 16 },
  emptyList: { flexGrow: 1, padding: 16 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: "#0F766E",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emptyTitle: {
    marginTop: 12,
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
