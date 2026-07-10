import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
} from "react-native";
import React, { useMemo, useRef } from "react";
import { resolveMessageText } from "../../../utils/chatUtils";
import dayjs from "dayjs";
import { AuthAvatar } from "../../PostCard";
import { useSelector } from "react-redux";
import utils from "../../../helpers/utils";
import useGetImageMessage from "../../../hooks/useGetImageMessage";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { resolveDisplayName } from "../../../hooks/workplace/useNicknameMap";
import SwipeToReplyMessage from "./SwipeToReplyMessage";

const resolveMessageTime = (message) => {
  const value = message?.createdAt;
  return value ? dayjs(value).format("HH:mm") : "";
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.6;
const AVATAR_SIZE = 40;

export const REACTIONS = [
  { type: "like", emoji: "👍", label: "Thích", color: "#1877F2" },
  { type: "love", emoji: "❤️", label: "Yêu thích", color: "#ED2E30" },
  { type: "haha", emoji: "😆", label: "Haha", color: "#F7B928" },
  { type: "wow", emoji: "😮", label: "Wow", color: "#F7B928" },
  { type: "sad", emoji: "😢", label: "Buồn", color: "#F7B928" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ", color: "#E9710F" },
];

const REACTION_MAP = REACTIONS.reduce((acc, r) => {
  acc[r.type] = r;
  return acc;
}, {});

const ReactionSummaryBadge = ({ reactions, isMine, onPress, isImage }) => {
  if (!reactions?.length) return null;

  const counts = reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const topTypes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.reactionBadge,
        isMine ? styles.reactionBadgeMine : styles.reactionBadgeOther,
        isImage && { bottom: 12 },
      ]}
    >
      {topTypes.map((t) => (
        <Text key={t} style={styles.reactionBadgeEmoji}>
          {REACTION_MAP[t]?.emoji}
        </Text>
      ))}
      {reactions.length > 1 && (
        <Text style={styles.reactionBadgeCount}>{reactions.length}</Text>
      )}
    </TouchableOpacity>
  );
};

export const ReplyPreview = ({ replyTo, isMine, onPress, userInfo }) => {
  if (!replyTo) return null;

  const isRecalledOriginal = !!replyTo?.recalled?.at;
  const senderName = replyTo?.senderId?.full_name ?? "Người dùng";
  const previewText = isRecalledOriginal
    ? "Tin nhắn đã được thu hồi"
    : replyTo?.type === "image"
      ? "[Hình ảnh]"
      : replyTo?.content || "";

  const checkDeleted = replyTo?.deletedFor?.some((id) =>
    id.includes(userInfo?._id),
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(replyTo?._id)}
      style={[
        styles.replyPreview,
        isMine ? styles.replyPreviewMine : styles.replyPreviewOther,
      ]}
    >
      <Text
        style={[
          styles.replySenderText,
          isMine ? styles.replyTextMine : styles.replyTextOther,
        ]}
        numberOfLines={1}
      >
        {senderName}
      </Text>
      <Text
        style={[
          styles.replyContentText,
          isMine ? styles.replyTextMine : styles.replyTextOther,
        ]}
        numberOfLines={1}
      >
        {checkDeleted ? "Tin nhắn đã bị xoá" : previewText}
      </Text>
    </TouchableOpacity>
  );
};

const MessageBubble = ({
  item,
  isMine,
  onLongPress,
  sender,
  onPressImage,
  showAvatar = true,
  showSenderName = false,
  displayName,
  isLastInGroup = true,
  onPressReplyPreview,
  userInfo,
  nicknameMap,
  onPressTagName,
  onReply,
  onPressReactionSummary,
}) => {
  const translateX = useSharedValue(0);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const bubbleRef = useRef(null);

  const statusText = useMemo(() => {
    if (!isMine) return "";
    if (item?.status === "failed") return "Gửi thất bại";
    if (item?.status === "queued") return "Chờ gửi";
    if (item?.status === "sending") return "Đang gửi";
    return "Đã gửi";
  }, [item, isMine]);

  const isRecalled = !!item?.recalled?.at;
  const isImage = item?.type === "image" && !isRecalled;

  const { uri: imageUri, headers: imageHeaders } = useGetImageMessage(item);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const handleLongPress = () => {
    if (isRecalled && item?.type !== "text") {
    }

    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress?.({
        message: item,
        isMine,
        layout: { pageX: x, pageY: y, width, height },
        preview: {
          isMine,
          isImage,
          imageUri,
          imageHeaders,
          text: resolveMessageText(item),
          isRecalled,
          mentions: item?.mentions,
          replyTo: item?.replyTo,
          reactions: item?.reactions,
        },
      });
    });
  };

  const buildMentionSegments = (content, mentions) => {
    if (!content || !Array.isArray(mentions) || mentions.length === 0) {
      return [{ text: content ?? "", isMention: false }];
    }

    const nameToMention = mentions
      .map((m) => {
        if (m.type === "all") {
          return { name: "Mọi người", mention: m };
        }

        const rawUserId = m?.userId?._id ?? m?.userId;
        const fallbackName = m?.userId?.full_name ?? m?.full_name ?? "";
        const name = resolveDisplayName(nicknameMap, rawUserId, fallbackName);

        return { name, mention: m };
      })
      .filter((entry) => !!entry.name)
      .sort((a, b) => b.name.length - a.name.length);

    if (nameToMention.length === 0) {
      return [{ text: content, isMention: false }];
    }

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `@(${nameToMention.map((e) => escapeRegex(e.name)).join("|")})`,
      "g",
    );

    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          text: content.slice(lastIndex, match.index),
          isMention: false,
        });
      }

      const matchedName = match[1];
      const found = nameToMention.find((e) => e.name === matchedName);

      segments.push({
        text: match[0],
        isMention: true,
        mention: found?.mention ?? null,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      segments.push({ text: content.slice(lastIndex), isMention: false });
    }

    return segments;
  };

  return (
    <View
      style={[
        styles.messageRow,
        isMine ? styles.messageRowMine : styles.messageRowOther,
        !isLastInGroup && styles.messageRowGrouped,
      ]}
    >
      {!isMine &&
        (showAvatar ? (
          <Animated.View style={avatarAnimatedStyle}>
            <AuthAvatar
              filename={sender?.avatar}
              name={sender?.full_name}
              size={AVATAR_SIZE}
              cacheKey={sender?.updatedAt}
            />
          </Animated.View>
        ) : (
          <View style={styles.avatarSpacer} />
        ))}
      <SwipeToReplyMessage
        message={item}
        onReply={onReply}
        isMine={isMine}
        translateX={translateX}
        style={[styles.column, isMine ? styles.columnMine : styles.columnOther]}
      >
        {!isMine && showSenderName && !!displayName && (
          <Text style={styles.senderNameText} numberOfLines={1}>
            {displayName}
          </Text>
        )}

        {isImage ? (
          <View style={styles.imageWrap} ref={bubbleRef}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => onPressImage(item._id)}
              onLongPress={handleLongPress}
              delayLongPress={250}
            >
              <Image
                source={{
                  uri: imageUri,
                  headers: imageHeaders,
                }}
                style={[
                  styles.image,
                  {
                    width: MAX_IMAGE_WIDTH,
                    height: MAX_IMAGE_WIDTH,
                  },
                ]}
                contentFit="cover"
                transition={150}
              />
            </TouchableOpacity>
            <ReactionSummaryBadge
              reactions={item?.reactions}
              isMine={isMine}
              onPress={() => onPressReactionSummary(item?.reactions)}
              isImage={isImage}
            />
            {item?.status === "sending" && (
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>Đang gửi...</Text>
              </View>
            )}
            <View style={styles.imageMetaRow}>
              <Text style={styles.imageTimeText}>
                {resolveMessageTime(item)}
              </Text>
              {isMine && !!statusText && (
                <Text style={styles.imageStatusText}>{statusText}</Text>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            ref={bubbleRef}
            activeOpacity={isRecalled ? 1 : 0.85}
            onLongPress={handleLongPress}
            delayLongPress={250}
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
            ]}
          >
            <ReplyPreview
              replyTo={item.replyTo}
              isMine={isMine}
              onPress={onPressReplyPreview}
              userInfo={userInfo}
            />

            <Text
              style={[
                styles.messageText,
                isMine ? styles.messageTextMine : styles.messageTextOther,
              ]}
            >
              {isRecalled
                ? "Tin nhắn đã được thu hồi"
                : buildMentionSegments(
                    resolveMessageText(item),
                    item?.mentions,
                  ).map((seg, idx) => (
                    <Text
                      onPress={
                        seg.isMention
                          ? () => onPressTagName(seg.mention)
                          : undefined
                      }
                      key={idx}
                      style={seg.isMention && styles.mentionText}
                      suppressHighlighting={seg.isMention}
                    >
                      {seg.text}
                    </Text>
                  ))}
            </Text>

            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.timeText,
                  isMine ? styles.timeTextMine : styles.timeTextOther,
                ]}
              >
                {resolveMessageTime(item)}
              </Text>
              {isMine && !!statusText && (
                <Text style={[styles.statusText, styles.timeTextMine]}>
                  {statusText}
                </Text>
              )}
            </View>

            <ReactionSummaryBadge
              reactions={item?.reactions}
              isMine={isMine}
              onPress={() => onPressReactionSummary?.(item?.reactions)}
              isImage={isImage}
            />
          </TouchableOpacity>
        )}
      </SwipeToReplyMessage>
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  messageRow: { marginBottom: 10, flexDirection: "row" },
  messageRowGrouped: { marginBottom: 8 },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },

  avatarSpacer: { width: AVATAR_SIZE + 6 },

  column: { maxWidth: "82%" },
  columnMine: { alignItems: "flex-end" },
  columnOther: { alignItems: "flex-start" },

  senderNameText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 3,
    marginLeft: 6,
  },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "relative",
  },
  bubbleMine: { backgroundColor: "#0F766E", borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageTextMine: { color: "#FFF" },
  messageTextOther: { color: "#111827" },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  timeText: { fontSize: 11 },
  timeTextMine: { color: "rgba(255,255,255,0.78)" },
  timeTextOther: { color: "#6B7280" },
  statusText: { marginLeft: 8, fontSize: 11 },

  replyPreview: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  replyPreviewMine: {
    borderLeftColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  replyPreviewOther: {
    borderLeftColor: "#0F766E",
    backgroundColor: "#F3F4F6",
  },
  replySenderText: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  replyContentText: { fontSize: 12 },
  replyTextMine: { color: "rgba(255,255,255,0.85)" },
  replyTextOther: { color: "#374151" },

  imageWrap: { borderRadius: 14, overflow: "hidden", position: "relative" },
  image: { borderRadius: 14, backgroundColor: "#E5E7EB" },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageOverlayText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  imageMetaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 4,
    paddingRight: 2,
  },
  imageTimeText: { fontSize: 11, color: "#6B7280" },
  imageStatusText: { fontSize: 11, color: "#6B7280", marginLeft: 6 },
  mentionText: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  reactionBadge: {
    position: "absolute",
    bottom: -6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  reactionBadgeMine: { left: 6 },
  reactionBadgeOther: { right: 6 },
  reactionBadgeEmoji: { fontSize: 12, marginHorizontal: -1 },
  reactionBadgeCount: { fontSize: 12, color: "#6B7280", marginLeft: 3 },
});
