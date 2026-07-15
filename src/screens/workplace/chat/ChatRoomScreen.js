import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  buildTimelineItems,
  resolveConversationAccountId,
  resolveConversationId,
  resolveConversationTitle,
  resolveGroupAvatars,
  resolveMessageSender,
  isCurrentUser,
  getCurrentUserKeys,
  resolveConversationDisplayName,
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
import * as DocumentPicker from "expo-document-picker";
import ReactNativeBlobUtil from "react-native-blob-util";
import Share from "react-native-share";
import ImageViewing from "react-native-image-viewing";
import utils from "../../../helpers/utils";
import {
  resolveDisplayName,
  useNicknameMap,
} from "../../../hooks/workplace/useNicknameMap";
import useSocketStatus from "../../../hooks/workplace/useSocketStatus";
import ConnectionStatusBar from "../../../components/workplace/chat/ConnectionStatusBar";
import { store } from "../../../redux/store";
import { appendMessage } from "../../../redux/slice/chatSlice";
import MessageContextMenu from "../../../components/workplace/chat/MessageContextMenu";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — khớp giới hạn backend

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
  const [replyingTo, setReplyingTo] = useState(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionAnchor, setMentionAnchor] = useState(null);
  const [mentionEntities, setMentionEntities] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);

  const flatListRef = useRef(null);
  const endReachedDuringMomentumRef = useRef(false);

  const nicknameMap = useNicknameMap(conversation);
  const socketStatus = useSocketStatus();

  const currentUserKeys = useMemo(() => getCurrentUserKeys(user), [user]);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];

    const keyword = mentionQuery.trim().toLowerCase();
    const isGroup = conversation?.type === "group";

    const baseMembers = (conversation?.members ?? [])
      .filter((m) => !isCurrentUser(currentUserKeys, m))
      .map((m) => ({
        _id: m._id,
        full_name: resolveDisplayName(
          nicknameMap,
          m._id,
          m.full_name ?? "Thành viên",
        ),
        avatar: m.avatar,
        isAll: false,
      }));

    const allOption = isGroup
      ? [{ _id: "all", full_name: "Mọi người", isAll: true }]
      : [];

    const combined = [...allOption, ...baseMembers];

    if (!keyword) return combined;

    return combined.filter((m) => m.full_name.toLowerCase().includes(keyword));
  }, [mentionQuery, conversation, currentUserKeys, nicknameMap]);

  const otherMember = useMemo(() => {
    if (conversation?.type === "group") return null;
    return (conversation?.members ?? []).find(
      (m) => !isCurrentUser(currentUserKeys, m),
    );
  }, [conversation, currentUserKeys]);

  const headerTitle = useMemo(
    () =>
      resolveConversationDisplayName(
        conversation,
        currentUserKeys,
        nicknameMap,
      ),
    [conversation, currentUserKeys, nicknameMap],
  );

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

  const handleChangeText = (newText) => {
    setText(newText);

    setMentionEntities((prev) =>
      prev.filter((e) => newText.slice(e.start, e.end) === `@${e.full_name}`),
    );

    const cursorPos = selection.start ?? newText.length;
    const uptoCursor = newText.slice(0, cursorPos);
    const atIndex = uptoCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setMentionQuery(null);
      setMentionAnchor(null);
      return;
    }

    const textAfterAt = uptoCursor.slice(atIndex + 1);

    if (/\s/.test(textAfterAt)) {
      setMentionQuery(null);
      setMentionAnchor(null);
      return;
    }

    setMentionAnchor(atIndex);
    setMentionQuery(textAfterAt);
  };

  const handleSelectMention = (candidate) => {
    if (mentionAnchor === null) return;

    const queryLength = mentionQuery?.length ?? 0;
    const before = text.slice(0, mentionAnchor);
    const after = text.slice(mentionAnchor + 1 + queryLength);
    const insertedText = `@${candidate.full_name} `;
    const newText = `${before}${insertedText}${after}`;

    const delta = insertedText.length - (1 + queryLength);

    setMentionEntities((prev) => {
      const shifted = prev.map((e) =>
        e.start >= mentionAnchor
          ? { ...e, start: e.start + delta, end: e.end + delta }
          : e,
      );

      return [
        ...shifted,
        {
          id: candidate._id,
          full_name: candidate.full_name,
          start: mentionAnchor,
          end: mentionAnchor + insertedText.length - 1,
          isAll: !!candidate.isAll,
        },
      ];
    });

    setText(newText);
    setMentionQuery(null);
    setMentionAnchor(null);
  };

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
      const safeIndex = index < 0 ? 0 : index;

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

  const { sendMessage, sendImageMessage, sendFileMessage, sending } =
    useChatActions({
      conversationId,
      dispatch,
      user,
      scrollToBottom,
    });

  const startReply = useCallback((message) => {
    if (!message || message.type === "system") return;

    setReplyingTo(message);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;

    const replyToMessage = replyingTo;
    const mentionsPayload = mentionEntities.map((e) =>
      e.isAll
        ? { type: "all", userId: null, full_name: "Mọi người" }
        : { type: "user", userId: e.id, full_name: e.full_name },
    );

    setText("");
    setReplyingTo(null);
    setMentionEntities([]);
    setMentionQuery(null);
    setMentionAnchor(null);

    sendMessage(content, { replyToMessage, mentions: mentionsPayload });
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

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      if (asset.size && asset.size > MAX_FILE_SIZE) {
        Toast.show({
          type: "error",
          text1: "File vượt quá 5MB",
          text2: "Vui lòng chọn file nhỏ hơn",
        });
        return;
      }

      sendFileMessage({
        uri: asset.uri,
        name: asset.name ?? "file",
        mimeType: asset.mimeType,
        size: asset.size,
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Không thể chọn file" });
    }
  };

  const handleAttachPress = () => {
    const options = ["Ảnh", "Tệp đính kèm", "Huỷ"];
    const cancelButtonIndex = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) pickImage();
          if (buttonIndex === 1) pickFile();
        },
      );
    } else {
      Alert.alert("Đính kèm", undefined, [
        { text: "Ảnh", onPress: pickImage },
        { text: "Tệp đính kèm", onPress: pickFile },
        { text: "Huỷ", style: "cancel" },
      ]);
    }
  };

  const openFileAttachment = useCallback(
    async (message) => {
      const attachment = message?.attachment;
      if (!attachment?.url && message?.status === "sending") {
        Toast.show({ type: "info", text1: "File đang được gửi..." });
        return;
      }
      if (!message?._id || !conversationId) return;
      if (downloadingFileId) return; // tránh bấm dồn dập

      const originalName = attachment?.originalName ?? "file";

      try {
        setDownloadingFileId(message._id);
        Toast.show({ type: "info", text1: "Đang tải file..." });

        const url = chatApi.getFileUrl(conversationId, message._id);
        const { dirs } = ReactNativeBlobUtil.fs;
        const localPath = `${dirs.CacheDir}/${Date.now()}_${originalName}`;

        const res = await ReactNativeBlobUtil.config({
          fileCache: true,
          path: localPath,
        }).fetch("GET", url, {
          Authorization: `Bearer ${accessToken}`,
        });

        const filePath =
          Platform.OS === "android" ? `file://${res.path()}` : res.path();

        await Share.open({
          url: filePath,
          type: attachment?.mimeType || "application/octet-stream",
          filename: originalName,
          failOnCancel: false,
        });
      } catch (error) {
        Toast.show({ type: "error", text1: "Không thể mở file" });
      } finally {
        setDownloadingFileId(null);
      }
    },
    [conversationId, accessToken, downloadingFileId],
  );

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

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleReactMessage = useCallback(
    async (type, message) => {
      const messageId = message?._id;
      if (!conversationId || !messageId) return;
      try {
        const res = await chatApi.reactMessage(conversationId, messageId, type);
        const updatedMessage = res?.data?.data?.message;
        if (updatedMessage) {
          dispatch(appendMessage({ conversationId, message: updatedMessage }));
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1:
            error?.response?.data?.message ??
            error?.message ??
            "Không thể thả cảm xúc",
        });
      }
    },
    [conversationId, dispatch],
  );

  const handleMessageLongPress = useCallback(
    (snapshot) => {
      if (!snapshot?.message) return;
      const message = snapshot.message;
      const msgId =
        message?._id ?? message?.id ?? message?.clientMessageId ?? null;

      if (!msgId) {
        Toast.show({ type: "error", text1: "Không thể thao tác tin nhắn này" });
        return;
      }

      const sender = resolveMessageSender(message);
      const isMine = isCurrentUser(currentUserKeys, sender);
      const sentAt = message?.createdAt ? dayjs(message.createdAt) : null;
      const canRecall =
        isMine && sentAt ? dayjs().diff(sentAt, "minute") <= 60 : false;
      const isImage = message.type === "image";
      const isFile = message.type === "file";
      const isRecalled = !!message?.recalled?.at;

      const actions = [];

      if (!isRecalled) {
        actions.push({
          key: "reply",
          label: "Trả lời",
          onPress: () => startReply(message),
        });

        if (!isImage && !isFile) {
          actions.push({
            key: "copy",
            label: "Sao chép",
            onPress: () => handleCopy(message.content),
          });
        }

        if (isFile) {
          actions.push({
            key: "download",
            label: "Tải xuống",
            onPress: () => openFileAttachment(message),
          });
        }

        if (canRecall) {
          actions.push({
            key: "recall",
            label: "Thu hồi",
            destructive: true,
            onPress: () => showRecalledConfirm(msgId, message._id),
          });
        }
      }

      actions.push({
        key: "delete",
        label: "Xoá với tôi",
        destructive: true,
        onPress: () => showDeleteWithMeConfirm(msgId, message._id),
      });

      setContextMenu({
        message,
        isMine,
        layout: snapshot.layout,
        preview: snapshot.preview,
        actions,
      });
    },
    [currentUserKeys, startReply, openFileAttachment],
  );

  const handlePressReplyPreview = useCallback(
    async (replyToId) => {
      if (!replyToId || !conversationId) return;

      let targetIndex = timelineItems.findIndex(
        (item) => item?.message?._id === replyToId,
      );

      if (targetIndex !== -1) {
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          viewPosition: 0.5,
          animated: true,
        });

        setTimeout(() => {
          setHighlightMessageId(replyToId);

          setTimeout(() => {
            setHighlightMessageId(null);
          }, 1000);
        }, 350);

        return;
      }

      try {
        const res = await chatApi.getMessageById(conversationId, replyToId);

        if (!res.data.data) {
          Toast.show({
            type: "info",
            text1: "Không tìm thấy tin nhắn",
          });
          return;
        }

        while (hasMore) {
          await loadMore();

          await new Promise((resolve) => setTimeout(resolve, 100));

          const latestItems = buildTimelineItems(
            [
              ...(store.getState().chat.messagesByConversationId?.[
                conversationId
              ] ?? []),
            ].reverse(),
          );

          targetIndex = latestItems.findIndex(
            (item) => item?.message?._id === replyToId,
          );

          if (targetIndex !== -1) {
            requestAnimationFrame(() => {
              flatListRef.current?.scrollToIndex({
                index: targetIndex,
                viewPosition: 0.5,
                animated: true,
              });

              setTimeout(() => {
                setHighlightMessageId(replyToId);

                setTimeout(() => {
                  setHighlightMessageId(null);
                }, 1000);
              }, 350);
            });
            return;
          }
        }

        Toast.show({
          type: "info",
          text1: "Không tìm thấy trong lịch sử đã tải",
        });
      } catch (e) {
        Toast.show({
          type: "error",
          text1: "Tin nhắn không tồn tại.",
        });
      }
    },
    [conversationId, timelineItems, hasMore, loadMore],
  );

  const handlePressTagName = (user) => {
    if (!user?.userId) return;

    navigation.navigate("WorkplaceProfileScreen", {
      accountId: user?.userId?.id_account,
    });
  };

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
          title={headerTitle}
          avatar={avatar}
          insets={insets}
          onBack={() => navigation.goBack()}
          onPressProfile={() => {
            navigation.navigate("GroupChatSettingsScreen", {
              conversationId,
              conversation,
            });
          }}
        />

        <ConnectionStatusBar status={socketStatus} />

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
            onPressFile={openFileAttachment}
            downloadingFileId={downloadingFileId}
            nicknameMap={nicknameMap}
            conversation={conversation}
            onPressReplyPreview={handlePressReplyPreview}
            onReply={startReply}
            user={user}
            onPressTagName={handlePressTagName}
            highlightMessageId={highlightMessageId}
          />
        )}

        {mentionQuery !== null && mentionCandidates.length > 0 && (
          <View style={styles.mentionDropdown}>
            <FlatList
              data={mentionCandidates}
              keyExtractor={(item) => String(item._id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.mentionItem}
                  onPress={() => handleSelectMention(item)}
                >
                  {item.isAll ? (
                    <View style={styles.mentionAllIcon}>
                      <Ionicons name="people" size={18} color="#FFF" />
                    </View>
                  ) : (
                    <AuthAvatar
                      filename={item.avatar}
                      name={item.full_name}
                      size={30}
                    />
                  )}
                  <Text style={styles.mentionItemText} numberOfLines={1}>
                    {item.full_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {replyingTo && (
          <View style={styles.replyBar}>
            <View style={styles.replyBarAccent} />
            <View style={styles.replyBarContent}>
              <Text style={styles.replyBarLabel} numberOfLines={1}>
                Trả lời{" "}
                {isCurrentUser(
                  currentUserKeys,
                  resolveMessageSender(replyingTo),
                )
                  ? "chính bạn"
                  : (resolveMessageSender(replyingTo)?.full_name ?? "")}
              </Text>
              <Text style={styles.replyBarText} numberOfLines={1}>
                {replyingTo.type === "image"
                  ? "[Hình ảnh]"
                  : replyingTo.type === "file"
                    ? `📎 ${replyingTo.attachment?.originalName ?? "Tệp đính kèm"}`
                    : replyingTo.content || ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={cancelReply}
              style={styles.replyBarClose}
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
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
            onPress={handleAttachPress}
            disabled={sending}
          >
            <Ionicons name="add-circle-outline" size={26} color="#0F766E" />
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              value={text}
              onChangeText={handleChangeText}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
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

      <MessageContextMenu
        userInfo={user}
        visible={!!contextMenu}
        onClose={closeContextMenu}
        layout={contextMenu?.layout}
        preview={contextMenu?.preview}
        menuActions={contextMenu?.actions ?? []}
        nicknameMap={nicknameMap}
        onSelectReaction={(type) => {
          handleReactMessage(type, contextMenu?.message);
          closeContextMenu();
        }}
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

  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  replyBarAccent: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: "#0F766E",
    marginRight: 8,
  },
  replyBarContent: {
    flex: 1,
  },
  replyBarLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F766E",
  },
  replyBarText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },
  replyBarClose: {
    padding: 6,
    marginLeft: 8,
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
  mentionDropdown: {
    maxHeight: 220,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  mentionAllIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0F766E",
    justifyContent: "center",
    alignItems: "center",
  },
  mentionItemText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
});
