import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  buildTimelineItems,
  getCurrentUserKeys,
  resolveConversationAccountId,
  resolveConversationId,
  resolveConversationTitle,
  resolveGroupAvatars,
  resolveMessageSender,
  isCurrentUser,
} from "../../../utils/chatUtils";
import { getChatSocket } from "../../../libs/chatSocket";
import chatApi from "../../../api/chat";
import ChatRoomHeader from "../../../components/workplace/chat/ChatRoomHeader";
import ChatRoomMessageList from "../../../components/workplace/chat/ChatRoomMessageList";
import { AuthAvatar } from "../../../components/PostCard";
import useChatRoom from "../../../hooks/workplace/useChatRoom";
import useChatActions from "../../../hooks/workplace/useChatActions";
import useChatMessages from "../../../hooks/workplace/useChatMessages";
import dayjs from "dayjs";
import Toast from "react-native-toast-message";
import AvatarGroup from "../../../components/workplace/chat/AvatarGroup";
import * as ImagePicker from "expo-image-picker";
import ImageViewing from "react-native-image-viewing";
import utils from "../../../helpers/utils";

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

  const [text, setText] = useState("");
  const [conversation, setConversation] = useState(initialConversation ?? null);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const flatListRef = useRef(null);
  const endReachedDuringMomentumRef = useRef(false);

  const currentUserKeys = useMemo(() => getCurrentUserKeys(user), [user]);

  const conversationId = useMemo(
    () =>
      String(
        resolveConversationId(conversation) ?? routeConversationId ?? "",
      ) || null,
    [conversation, routeConversationId],
  );

  const messages = chatState.messagesByConversationId?.[conversationId] ?? [];

  const loadingMessages =
    chatState.loadingMessagesByConversationId?.[conversationId] ?? false;

  const messagesDescending = useMemo(() => [...messages].reverse(), [messages]);

  const timelineItems = useMemo(
    () => buildTimelineItems(messagesDescending),
    [messagesDescending],
  );

  const imageMessages = useMemo(() => {
    return messages.filter(
      (msg) =>
        msg?.type === "image" &&
        !msg?.recalled?.at &&
        msg?._id &&
        msg?.conversationId,
    );
  }, [messages]);

  const openImageViewer = useCallback(
    (messageId) => {
      const images = imageMessages.map((msg) => ({
        uri:
          msg?.status === "sending" && msg?.attachment?.url?.startsWith("file:")
            ? msg.attachment.url
            : `${utils.BASE_URL}/chat/conversations/${msg.conversationId}/messages/${msg._id}/image`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }));

      const index = imageMessages.findIndex((msg) => msg._id === messageId);

      setViewerImages(images);
      setViewerIndex(index < 0 ? 0 : index);
      setViewerVisible(true);
    },
    [imageMessages, accessToken],
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset?.({
        offset: 0,
        animated: true,
      });
    }, 80);
  }, []);

  const markSeen = useCallback(async () => {
    if (!conversationId) return;

    const socket = getChatSocket();

    if (socket?.connected) {
      socket.emit("chat:seen", {
        conversationId,
      });
      return;
    }

    await chatApi.markConversationSeen(conversationId);
  }, [conversationId]);

  const { loadMessages, loadMore, loadingMore, hasMore } = useChatMessages({
    conversationId,
    dispatch,
    messagesByConversationId: chatState.messagesByConversationId,
  });

  useChatRoom({
    conversationId,
    accessToken,
    dispatch,
    setConversation,
    loadMessages,
    markSeen,
  });

  const { sendMessage, sendImageMessage, sending } = useChatActions({
    conversationId,
    dispatch,
    user,
    scrollToBottom,
  });

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    sendMessage(content);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Cần cấp quyền truy cập ảnh",
        "Vui lòng cấp quyền truy cập thư viện ảnh trong phần Cài đặt để thay đổi avatar.",
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Mở Cài đặt",
            onPress: () => Linking.openSettings(),
          },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    sendImageMessage({
      uri: asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
      width: asset.width,
      height: asset.height,
    });
  };

  const showRecalledConfirm = (msgId, _id) =>
    Alert.alert(
      "Thu hồi tin nhắn",
      "Tin nhắn sẽ bị thu hồi với tất cả mọi người. Bạn có chắc không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Thu hồi",
          style: "destructive",
          onPress: async () => {
            const socket = getChatSocket();
            const messageId = _id ?? msgId;
            try {
              await chatApi.recallMessage(conversationId, messageId);
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

  const showDeleteWithMeConfirm = (msgId, _id) => {
    Alert.alert(
      "Xoá với tôi",
      "Tin nhắn sẽ bị xoá với tôi. Bạn có chắc không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            const messageId = _id ?? msgId;
            try {
              await chatApi.deleteMessageForSelf(conversationId, messageId);
              await loadMessages();
              Toast.show({ type: "success", text1: "Đã xoá tin nhắn" });
            } catch (error) {
              Toast.show({
                type: "error",
                text1:
                  error?.response?.data?.message ??
                  error?.message ??
                  "Xoá thất bại",
              });
            }
          },
        },
      ],
    );
  };

  const handleCopy = async (content) => {
    try {
      const textToCopy = content ?? "";
      if (!textToCopy) {
        Toast.show({ type: "info", text1: "Không có nội dung để sao chép" });
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
      } // Kiểm tra tin nhắn có phải của mình không
      const sender = resolveMessageSender(message);
      const isMine = isCurrentUser(currentUserKeys, sender);
      const sentAt = message?.createdAt ? dayjs(message.createdAt) : null;
      const canRecall =
        isMine && sentAt ? dayjs().diff(sentAt, "minute") <= 60 : false;
      if (Platform.OS === "ios" && ActionSheetIOS) {
        const options = ["Sao chép"];
        if (canRecall) options.push("Thu hồi");
        options.push("Xóa với tôi");
        options.push("Huỷ");
        const cancelIndex = options.length - 1;
        const destructiveIndex = canRecall ? [1, 2] : [1];
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
              showRecalledConfirm(msgId, message._id);
            } else if (
              (canRecall && buttonIndex === 2) ||
              (!canRecall && buttonIndex === 1)
            ) {
              showDeleteWithMeConfirm(msgId, message._id);
            }
          },
        );
      } else {
        const alertButtons = [{ text: "Sao chép", onPress: handleCopy }];
        if (canRecall) {
          alertButtons.push({
            text: "Thu hồi",
            style: "destructive",
            onPress: showRecalledConfirm,
          });
        }
        alertButtons.push({
          text: "Xóa với tôi",
          style: "destructive",
          onPress: showDeleteWithMeConfirm,
        });
        alertButtons.push({ text: "Huỷ", style: "cancel" });
        Alert.alert("Tuỳ chọn", null, alertButtons, { cancelable: true });
      }
    },
    [conversationId, currentUserKeys, dispatch],
  );

  const groupAvatars =
    conversation?.type === "group" && !conversation?.avatar
      ? resolveGroupAvatars(conversation)
      : [];

  const avatar = conversation?.avatar ? (
    <AuthAvatar
      filename={conversation.avatar}
      name={conversation.full_name}
      size={46}
      cacheKey={conversation.updatedAt}
    />
  ) : groupAvatars.length > 0 ? (
    <AvatarGroup count={groupAvatars.length} groupAvatars={groupAvatars} />
  ) : (
    <View style={styles.avatarWrap}>
      <Ionicons name="person" size={24} color="#fff" />
    </View>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ChatRoomHeader
          title={resolveConversationTitle(conversation, currentUserKeys)}
          avatar={avatar}
          insets={insets}
          onBack={() => navigation.goBack()}
          onPressProfile={() => {
            if (conversation?.type === "group") {
              navigation.navigate("GroupChatSettingsScreen", {
                conversationId,
                conversation,
              });
            } else {
              navigation.navigate("WorkplaceProfileScreen", {
                accountId: resolveConversationAccountId(
                  conversation,
                  currentUserKeys,
                ),
              });
            }
          }}
        />

        {loadingMessages && messages.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#0F766E" />
          </View>
        ) : (
          <ChatRoomMessageList
            flatListRef={flatListRef}
            timelineItems={timelineItems}
            currentUserKeys={currentUserKeys}
            handleMessageLongPress={handleMessageLongPress}
            loadingMore={loadingMore}
            hasMore={hasMore}
            loadMore={loadMore}
            endReachedDuringMomentumRef={endReachedDuringMomentumRef}
            messages={messages}
            onPressImage={openImageViewer}
          />
        )}

        <View
          style={[
            styles.composer,
            {
              paddingBottom: Math.max(insets.bottom + 8, 12),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickImage}
            disabled={sending}
          >
            <Ionicons name="image-outline" size={24} color="#0F766E" />
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Nhập tin nhắn..."
              style={styles.input}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!text.trim() || sending) && styles.sendButtonDisabled,
            ]}
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

      <ImageViewing
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  body: {
    flex: 1,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  inputWrap: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },

  input: {
    minHeight: 24,
    maxHeight: 120,
    fontSize: 15,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0F766E",
    justifyContent: "center",
    alignItems: "center",
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
  },

  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
});
