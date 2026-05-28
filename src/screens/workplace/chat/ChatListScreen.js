import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
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
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let socket = null;

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
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Tin nhắn"
        leftIconName="menu"
        onLeftPress={() => openDrawer()}
        rightIconName="reload"
        onRightPress={loadConversations}
      />

      {loading && conversations.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0F766E" />
        </View>
      ) : (
        <FlatList
          data={conversations}
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
    </SafeAreaView>
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
