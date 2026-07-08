import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useMemo } from "react";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import {
  isCurrentUser,
  resolveConversationDisplayName,
  resolveConversationId,
  resolveConversationTitle,
  resolveGroupAvatars,
} from "../../../utils/chatUtils";
import dayjs from "dayjs";
import { AuthAvatar } from "../../PostCard";
import AvatarGroup from "./AvatarGroup";
import {
  resolveDisplayName,
  useNicknameMap,
} from "../../../hooks/workplace/useNicknameMap";

const resolveLastMessageText = (conversation) => {
  const lastMessage = conversation?.lastMessage ?? null;
  const isRecalled = !!lastMessage?.recalled?.at;

  if (!lastMessage) return "Bắt đầu cuộc trò chuyện";
  else if (isRecalled) return "Tin nhắn đã được thu hồi";
  else if (lastMessage.type === "image" && !isRecalled) return "[Hình ảnh]";
  else if (lastMessage.type === "text") return lastMessage.content;

  return lastMessage?.content ?? "Tin nhắn mới";
};

const isConversationUnread = (
  conversation,
  currentUserInfoId,
  currentUserKeys,
) => {
  const lastMessage = conversation?.lastMessage ?? null;
  if (!lastMessage || !currentUserInfoId) return false;

  const sender = lastMessage?.senderId;
  if (isCurrentUser(currentUserKeys, sender)) return false;

  const seenBy = Array.isArray(lastMessage?.seenBy) ? lastMessage.seenBy : [];
  return !seenBy.map(String).includes(String(currentUserInfoId));
};

const resolveLastMessageTime = (conversation) => {
  const lastMessage = conversation?.lastMessage ?? null;
  const value = lastMessage?.createdAt ?? conversation?.updatedAt;
  return value ? dayjs(value).fromNow() : "";
};

const resolveLastSenderName = (
  conversation,
  currentUserKeys,
  currentUserInfoId,
) => {
  const lastMessage = conversation?.lastMessage ?? null;
  const sender = lastMessage?.senderId;

  if (!sender) return "";

  if (
    isCurrentUser(currentUserKeys, sender) ||
    (currentUserInfoId && String(sender?._id) === String(currentUserInfoId))
  ) {
    return "Bạn";
  }

  return sender?.full_name ?? sender?.name ?? sender?.ma_nv ?? "Người nhắn";
};

const getConversationPreview = (
  conversation,
  currentUserKeys,
  currentUserInfoId,
) => {
  const lastMessage = conversation?.lastMessage ?? null;
  if (!lastMessage) return "Bắt đầu cuộc trò chuyện";

  const senderName = resolveLastSenderName(
    conversation,
    currentUserKeys,
    currentUserInfoId,
  );
  const messageText = resolveLastMessageText(conversation);

  return senderName ? `${senderName}: ${messageText}` : messageText;
};

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

const ConversationRow = ({
  item,
  currentUserKeys,
  currentUserInfoId,
  onPress,
  onDelete,
}) => {
  const preview = getConversationPreview(
    item,
    currentUserKeys,
    currentUserInfoId,
  );
  const nicknameMap = useNicknameMap(item);

  const time = resolveLastMessageTime(item);
  const isUnread = isConversationUnread(
    item,
    currentUserInfoId,
    currentUserKeys,
  );

  const groupAvatars =
    item?.type === "group" && !item?.avatar ? resolveGroupAvatars(item) : [];
  const count = groupAvatars.length;

  const displayName = useMemo(
    () => resolveConversationDisplayName(item, currentUserKeys, nicknameMap),
    [item, currentUserKeys, nicknameMap],
  );

  return (
    <Swipeable
      renderRightActions={() => (
        <RectButton
          style={styles.deleteButton}
          onPress={() => onDelete?.(String(resolveConversationId(item)))}
        >
          <Text style={styles.deleteButtonText}>Xoá</Text>
        </RectButton>
      )}
    >
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={onPress}
      >
        {item.avatar ? (
          <AuthAvatar
            filename={item.avatar}
            name={item.full_name}
            size={46}
            cacheKey={item.updatedAt}
          />
        ) : groupAvatars.length > 0 ? (
          <AvatarGroup count={count} groupAvatars={groupAvatars} />
        ) : (
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
        )}

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text
              style={[styles.title, isUnread && styles.titleUnread]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <View style={styles.timeWrap}>
              {isUnread && <View style={styles.unreadDot} />}
              <Text style={styles.time}>{time}</Text>
            </View>
          </View>

          <View style={styles.rowBottom}>
            <Text
              style={[styles.preview, isUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {preview}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default ConversationRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#FFF",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  groupAvatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9CA3AF",
  },
  rowBody: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowBottom: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  title: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    paddingRight: 12,
  },
  titleUnread: { color: "#0F172A" },
  timeWrap: { flexDirection: "row", alignItems: "center" },
  time: { color: "#6B7280", fontSize: 12 },
  preview: { flex: 1, color: "#6B7280", fontSize: 14 },
  previewUnread: { color: "#111827", fontWeight: "600" },
  deleteButton: {
    width: 80,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginBottom: 12,
    marginRight: 12,
  },
  deleteButtonText: { color: "#FFF", fontWeight: "700" },
});
