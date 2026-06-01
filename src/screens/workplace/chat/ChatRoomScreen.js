import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActionSheetIOS,
  Clipboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import { connectChatSocket, getChatSocket } from "../../../libs/chatSocket";
import {
  appendMessage,
  clearActiveConversationId,
  setActiveConversationId,
  setLoadingMessages,
  setMessages,
  upsertConversation,
  updateMessageStatus,
} from "../../../redux/slice/chatSlice";
import {
  buildTimelineItems,
  getCurrentUserKeys,
  isCurrentUser,
  makeClientMessageId,
  resolveConversationId,
  resolveConversationTitle,
  resolveConversationAccountId,
  resolveMessageSender,
  resolveGroupAvatars,
} from "../../../utils/chatUtils";
import chatApi from "../../../api/chat";
import MessageBubble from "../../../components/workplace/chat/MessageBubble";
import DateSeparator from "./DateSeparator";
import { AuthAvatar } from "../../../components/PostCard";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const LIMIT = 15;

const renderAvatarCell = (avatar) => {
  if (!avatar) return null;

  if (avatar.filename) {
    return (
      <AuthAvatar
        filename={avatar.filename}
        name={avatar.name}
        cacheKey={avatar.cacheKey}
        isFlex
      />
    );
  }

  return (
    <View style={styles.groupAvatarFallback}>
      <Ionicons name="person" size={12} color="#fff" />
    </View>
  );
};

export default function ChatRoomScreen({ route, navigation }) {
  const {
    conversationId: routeConversationId,
    conversation: initialConversation,
  } = route.params ?? {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const chatState = useSelector((state) => state.chat);

  const currentUserKeys = useMemo(() => getCurrentUserKeys(user), [user]);
  const flatListRef = useRef(null);
  const pageRef = useRef(1);
  const endReachedDuringMomentumRef = useRef(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(initialConversation ?? null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const groupAvatars =
    conversation?.type === "group" && !conversation?.avatar
      ? resolveGroupAvatars(conversation)
      : [];
  const count = groupAvatars.length;

  const conversationId = useMemo(
    () =>
      String(
        resolveConversationId(conversation) ?? routeConversationId ?? "",
      ) || null,
    [conversation, routeConversationId],
  );

  const messages = chatState.messagesByConversationId?.[conversationId] ?? [];
  const messagesDescending = useMemo(() => [...messages].reverse(), [messages]);
  const timelineItems = useMemo(
    () => buildTimelineItems(messagesDescending),
    [messagesDescending],
  );
  const loadingMessages =
    chatState.loadingMessagesByConversationId?.[conversationId] ?? false;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    }, 80);
  }, []);

  console.log(messages);
  
  const markSeen = useCallback(async () => {
    if (!conversationId) return;

    const socket = getChatSocket();
    if (socket?.connected) {
      socket.emit("chat:seen", { conversationId });
      return;
    }

    try {
      await chatApi.markConversationSeen(conversationId);
    } catch (error) {
      console.log(
        "[chat] mark seen fallback error",
        error?.response?.data ?? error?.message ?? error,
      );
    }
  }, [conversationId]);

  const loadConversationMeta = useCallback(async () => {
    if (!conversationId) return;

    try {
      const res = await chatApi.getConversation(conversationId);
      const item = res?.data?.data ?? res?.data ?? res;
      if (item) {
        setConversation(item);
        dispatch(upsertConversation(item));
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Không thể tải thông tin cuộc trò chuyện",
      });
    }
  }, [conversationId, dispatch]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    pageRef.current = 1;
    setHasMore(true);

    dispatch(setLoadingMessages({ conversationId, loading: true }));
    try {
      const res = await chatApi.getMessages(conversationId, 1, LIMIT);

      const items = res?.data?.data ?? res?.data ?? [];
      dispatch(setMessages({ conversationId, messages: items }));
      scrollToBottom();
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Không thể tải lịch sử chat",
      });
    } finally {
      dispatch(setLoadingMessages({ conversationId, loading: false }));
    }
  }, [conversationId, dispatch]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loadingMore) return;

    const nextPage = pageRef.current + 1;
    setLoadingMore(true);

    try {
      const res = await chatApi.getMessages(conversationId, nextPage, LIMIT);
      const items = res?.data?.data ?? res?.data ?? [];

      if (items.length === 0) {
        setHasMore(false);
        return;
      }

      pageRef.current = nextPage;
      setHasMore(items.length === LIMIT);
      const current =
        chatState.messagesByConversationId?.[conversationId] ?? [];
      dispatch(
        setMessages({ conversationId, messages: [...items, ...current] }),
      );
    } finally {
      setLoadingMore(false);
    }
  }, [
    hasMore,
    loadingMore,
    conversationId,
    dispatch,
    chatState.messagesByConversationId,
  ]);

  const showDeleteConfirm = (msgId, _id) =>
    Alert.alert(
      "Thu hồi tin nhắn",
      "Tin nhắn sẽ bị thu hồi với tất cả mọi người. Bạn có chắc không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            const messageId = _id ?? msgId;
            try {
              const socket = getChatSocket();

              if (socket?.connected) {
                socket.emit(
                  "chat:deleteMessage",
                  { conversationId, messageId },
                  (response) => {
                    if (!response?.ok) {
                      Toast.show({
                        type: "error",
                        text1: response?.message ?? "Thu hồi thất bại",
                      });
                      return;
                    }

                    Toast.show({
                      type: "success",
                      text1: "Đã thu hồi tin nhắn",
                    });
                  },
                );
                return;
              }

              await chatApi.deleteMessage(conversationId, messageId);
              dispatch(
                deleteMessageAction({
                  conversationId,
                  messageId,
                }),
              );
              Toast.show({ type: "success", text1: "Đã thu hồi tin nhắn" });
            } catch (error) {
              Toast.show({
                type: "error",
                text1:
                  error?.response?.data?.message ??
                  error?.message ??
                  "Thu hồi thất bại",
              });
            }
          },
        },
      ],
    );

  const handleCopy = async (content) => {
    try {
      const textToCopy = content ?? "";
      if (!textToCopy) {
        Toast.show({
          type: "info",
          text1: "Không có nội dung để sao chép",
        });
        return;
      }
      if (Platform.OS === "android" || Platform.OS === "ios") {
        Clipboard.setString(textToCopy);
        Toast.show({ type: "success", text1: "Đã sao chép" });
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        Toast.show({ type: "success", text1: "Đã sao chép" });
      } else {
        Toast.show({
          type: "info",
          text1: "Trình duyệt không hỗ trợ sao chép",
        });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Sao chép thất bại" });
    }
  };

  const handleMessageLongPress = useCallback(
    (message) => {
      if (!message) return;
      const msgId =
        message?._id ?? message?.id ?? message?.clientMessageId ?? null;
      if (!msgId) {
        Toast.show({ type: "error", text1: "Không thể thao tác tin nhắn này" });
        return;
      }

      // Kiểm tra tin nhắn có phải của mình không
      const sender = resolveMessageSender(message);
      const isMine = isCurrentUser(currentUserKeys, sender);

      // Kiểm tra có trong 1 tiếng không
      const sentAt = message?.createdAt ? dayjs(message.createdAt) : null;
      const canRecall =
        isMine && sentAt ? dayjs().diff(sentAt, "minute") <= 60 : false;

      if (Platform.OS === "ios" && ActionSheetIOS) {
        const options = ["Sao chép"];
        if (canRecall) options.push("Thu hồi");
        options.push("Huỷ");

        const cancelIndex = options.length - 1;
        const destructiveIndex = canRecall ? 1 : -1;

        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            destructiveButtonIndex: destructiveIndex,
            cancelButtonIndex: cancelIndex,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) {
              handleCopy(message.content);
            } else if (canRecall && buttonIndex === 1) {
              showDeleteConfirm(msgId, message._id);
            }
          },
        );
      } else {
        const alertButtons = [{ text: "Sao chép", onPress: handleCopy }];
        if (canRecall) {
          alertButtons.push({
            text: "Thu hồi",
            style: "destructive",
            onPress: showRecallConfirm,
          });
        }
        alertButtons.push({ text: "Huỷ", style: "cancel" });

        Alert.alert("Tuỳ chọn", null, alertButtons, { cancelable: true });
      }
    },
    [conversationId, currentUserKeys, dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return undefined;

      let socket = null;

      const joinRoom = () => {
        const instance = getChatSocket();
        if (instance?.connected) {
          instance.emit("chat:join", { conversationId });
          instance.emit("chat:seen", { conversationId });
        }
      };

      const bootstrap = async () => {
        dispatch(setActiveConversationId(conversationId));
        socket = await connectChatSocket(accessToken);

        if (socket) {
          socket.on("connect", joinRoom);
          socket.on("reconnect", joinRoom);
        }

        await Promise.all([loadConversationMeta(), loadMessages()]);

        if (socket?.connected) {
          joinRoom();
          markSeen();
        }
      };

      bootstrap();

      return () => {
        if (socket) {
          socket.emit("chat:leave", { conversationId });
          socket.off("connect", joinRoom);
          socket.off("reconnect", joinRoom);
        }
        dispatch(clearActiveConversationId());
      };
    }, [
      accessToken,
      conversationId,
      dispatch,
      loadConversationMeta,
      loadMessages,
      markSeen,
    ]),
  );

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !conversationId || sending) return;

    const clientMessageId = makeClientMessageId();
    const senderId = user?.userInfo ?? {
      _id:
        user?.userInfo?._id ?? user?._id ?? user?.id ?? user?.user_id ?? null,
      id_account:
        user?.userInfo?.id_account ??
        user?.id_account ??
        user?.account?.id ??
        null,
      full_name: user?.full_name ?? "Bạn",
      avatar: user?.avatar ?? null,
      ma_nv: user?.ma_nv ?? "",
    };

    const optimisticMessage = {
      _id: clientMessageId,
      clientMessageId,
      conversationId,
      senderId,
      type: "text",
      content,
      seenBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending",
    };

    setText("");
    setSending(true);
    dispatch(appendMessage({ conversationId, message: optimisticMessage }));
    dispatch(
      upsertConversation({
        _id: conversationId,
        lastMessage: optimisticMessage,
      }),
    );
    scrollToBottom();

    try {
      const socket = getChatSocket();

      if (socket?.connected) {
        socket.emit("chat:send", { conversationId, content, clientMessageId });
      } else {
        const res = await chatApi.sendMessage(conversationId, {
          content,
          clientMessageId,
        });
        const sentMessage = res?.data?.data ?? res?.data ?? res;

        if (sentMessage) {
          if (clientMessageId && !sentMessage.clientMessageId) {
            sentMessage.clientMessageId = clientMessageId;
          }
          dispatch(
            updateMessageStatus({
              conversationId,
              clientMessageId,
              status: "sent",
            }),
          );
          dispatch(appendMessage({ conversationId, message: sentMessage }));
          dispatch(
            upsertConversation({
              _id: conversationId,
              lastMessage: sentMessage,
            }),
          );
        }
      }
    } catch (error) {
      dispatch(
        updateMessageStatus({
          conversationId,
          clientMessageId,
          status: "failed",
          error:
            error?.response?.data?.message ??
            error?.message ??
            "Gửi tin nhắn thất bại",
        }),
      );
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Gửi tin nhắn thất bại",
      });
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              conversation?.type === "group"
                ? navigation.navigate("GroupChatSettingsScreen", {
                    conversationId,
                    conversation,
                  })
                : navigation.navigate("WorkplaceProfileScreen", {
                    accountId: resolveConversationAccountId(
                      conversation,
                      currentUserKeys,
                    ),
                  })
            }
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            activeOpacity={0.85}
          >
            {conversation.avatar ? (
              <AuthAvatar
                filename={conversation.avatar}
                name={conversation.full_name}
                size={46}
                cacheKey={conversation.updatedAt}
              />
            ) : groupAvatars.length > 0 ? (
              <View style={styles.groupAvatarWrap}>
                {count === 1 && (
                  <View style={styles.fullCell}>
                    {renderAvatarCell(groupAvatars[0])}
                  </View>
                )}

                {count === 2 && (
                  <>
                    <View style={styles.halfCell}>
                      {renderAvatarCell(groupAvatars[0])}
                    </View>
                    <View style={styles.halfCell}>
                      {renderAvatarCell(groupAvatars[1])}
                    </View>
                  </>
                )}

                {count === 3 && (
                  <>
                    <View style={styles.largeCell}>
                      {renderAvatarCell(groupAvatars[0])}
                    </View>
                    <View style={styles.stackCell}>
                      <View style={styles.stackHalf}>
                        {renderAvatarCell(groupAvatars[1])}
                      </View>
                      <View style={styles.stackHalf}>
                        {renderAvatarCell(groupAvatars[2])}
                      </View>
                    </View>
                  </>
                )}

                {count >= 4 && (
                  <>
                    {groupAvatars.slice(0, 4).map((avatar) => (
                      <View key={avatar.id} style={styles.quarterCell}>
                        {renderAvatarCell(avatar)}
                      </View>
                    ))}
                  </>
                )}
              </View>
            ) : (
              <View style={styles.avatarWrap}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            )}

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {resolveConversationTitle(conversation, currentUserKeys)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {loadingMessages && messages.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#0F766E" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={timelineItems}
            keyExtractor={(item, index) => String(item?.key ?? index)}
            renderItem={({ item }) => {
              if (item?.type === "separator") {
                return <DateSeparator label={item.label} />;
              }

              const sender = resolveMessageSender(item.message);
              const isMine = isCurrentUser(currentUserKeys, sender);
              return (
                <MessageBubble
                  item={item.message}
                  isMine={isMine}
                  onLongPress={() => handleMessageLongPress(item.message)}
                />
              );
            }}
            inverted
            onMomentumScrollBegin={() => {
              endReachedDuringMomentumRef.current = false;
            }}
            onEndReached={() => {
              if (
                endReachedDuringMomentumRef.current ||
                loadingMore ||
                !hasMore
              ) {
                return;
              }

              endReachedDuringMomentumRef.current = true;
              loadMore();
            }}
            onEndReachedThreshold={0.2}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadMoreWrap}>
                  <ActivityIndicator size="small" color="#0F766E" />
                </View>
              ) : !hasMore && messages.length > 0 ? (
                <View style={styles.loadMoreWrap}>
                  <Text style={styles.loadMoreText}>
                    Đã tải toàn bộ tin nhắn
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={
              messages.length === 0 ? styles.emptyMessages : styles.messagesList
            }
            onContentSizeChange={() => {
              if (pageRef.current < 1 && messages.length > 0) scrollToBottom();
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={42}
                  color="#9CA3AF"
                />
                <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
                <Text style={styles.emptyText}>
                  Hãy gửi lời chào đầu tiên để bắt đầu cuộc trò chuyện.
                </Text>
              </View>
            }
          />
        )}

        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom + 8, 12) },
          ]}
        >
          <View style={styles.inputWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
              maxLength={4000}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!text.trim() || sending) && styles.sendButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  header: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { color: "#111827", fontSize: 17, fontWeight: "700" },
  body: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  messagesList: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
  emptyMessages: { flexGrow: 1, paddingHorizontal: 12, paddingTop: 12 },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  input: {
    minHeight: 24,
    maxHeight: 120,
    color: "#111827",
    fontSize: 15,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  sendButtonDisabled: { opacity: 0.55 },
  loadMoreWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loadMoreText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  groupAvatarWrap: {
    width: 46,
    height: 46,
    marginRight: 12,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fullCell: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  halfCell: {
    width: "50%",
    height: "100%",
    overflow: "hidden",
  },
  largeCell: {
    width: "50%",
    height: "100%",
    overflow: "hidden",
  },
  stackCell: {
    width: "50%",
    height: "100%",
  },
  stackHalf: {
    width: "100%",
    height: "50%",
    overflow: "hidden",
  },
  quarterCell: {
    width: "50%",
    height: "50%",
    overflow: "hidden",
  },
  groupAvatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9CA3AF",
  },
});
