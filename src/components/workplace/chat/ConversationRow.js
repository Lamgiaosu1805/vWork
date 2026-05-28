import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { isCurrentUser } from "../../../utils/chatUtils";
import dayjs from "dayjs";

const resolveLastMessageText = (conversation) => {
  const lastMessage = conversation?.lastMessage ?? null;
  if (!lastMessage) return "Bắt đầu cuộc trò chuyện";
  if (typeof lastMessage === "string") return lastMessage;

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

const ConversationRow = ({
  item,
  currentUserKeys,
  currentUserInfoId,
  onPress,
}) => {
  const preview = getConversationPreview(
    item,
    currentUserKeys,
    currentUserInfoId,
  );
  const time = resolveLastMessageTime(item);
  const isUnread = isConversationUnread(
    item,
    currentUserInfoId,
    currentUserKeys,
  );

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.avatarWrap}>
        <Ionicons name="chatbubbles" size={24} color="#0F766E" />
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.title, isUnread && styles.titleUnread]}
            numberOfLines={1}
          >
            {item.display_name ?? "Cuộc trò chuyện"}
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
    backgroundColor: "#E6FFFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
});
