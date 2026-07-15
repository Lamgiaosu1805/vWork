import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useMemo, useRef } from "react";
import { resolveMessageText } from "../../../utils/chatUtils";
import dayjs from "dayjs";
import { AuthAvatar } from "../../PostCard";
import { useSelector } from "react-redux";
import utils from "../../../helpers/utils";
import useGetImageMessage from "../../../hooks/useGetImageMessage";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { resolveDisplayName } from "../../../hooks/workplace/useNicknameMap";
import SwipeToReplyMessage from "./SwipeToReplyMessage";
import {
  formatFileSize,
  getFileExt,
  getFileTypeConfig,
} from "../../../helpers/fileHelper";
import ReactionSummaryBadge from "./ReactionSummaryBadge";
import ReplyPreview from "./ReplyPreview";

const resolveMessageTime = (message) => {
  const value = message?.createdAt;
  return value ? dayjs(value).format("HH:mm") : "";
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.6;
const AVATAR_SIZE = 40;

const MessageBubble = ({
  item,
  isMine,
  onLongPress,
  sender,
  onPressImage,
  onPressFile,
  isDownloadingFile = false,
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
  highlight,
}) => {
  const translateX = useSharedValue(0);
  const progressHightlighMess = useSharedValue(0);

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
  const isFile = item?.type === "file" && !isRecalled;

  const { uri: imageUri, headers: imageHeaders } = useGetImageMessage(item);

  const fileConfig = useMemo(
    () =>
      isFile
        ? getFileTypeConfig(
            item?.attachment?.originalName,
            item?.attachment?.mimeType,
          )
        : null,
    [isFile, item?.attachment?.originalName, item?.attachment?.mimeType],
  );

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const handleLongPress = () => {
    if (isRecalled) return;

    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress?.({
        message: item,
        isMine,
        layout: { pageX: x, pageY: y, width, height },
        preview: {
          isMine,
          isImage,
          isFile,
          imageUri,
          imageHeaders,
          text: resolveMessageText(item),
          isRecalled,
          mentions: item?.mentions,
          replyTo: item?.replyTo,
          reactions: item?.reactions,
          fileName: item?.attachment?.originalName ?? "Tệp đính kèm",
          fileSize: item?.attachment?.size,
          fileIcon: fileConfig?.icon,
          fileColor: fileConfig?.color,
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

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: 1 + progressHightlighMess.value * 0.15,
      },
    ],

    borderRadius: 18,
  }));

  useEffect(() => {
    if (highlight) {
      progressHightlighMess.value = 0;

      progressHightlighMess.value = withSequence(
        withTiming(1, { duration: 250 }),
        withTiming(0, { duration: 1200 }),
      );
    }
  }, [highlight]);

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
        isRecalled={isRecalled}
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
            {!isRecalled && (
              <ReactionSummaryBadge
                reactions={item?.reactions}
                isMine={isMine}
                onPress={() => onPressReactionSummary(item?.reactions)}
                isImage={isImage}
              />
            )}

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
        ) : isFile ? (
          <TouchableOpacity
            ref={bubbleRef}
            activeOpacity={0.85}
            onPress={() => onPressFile?.(item)}
            onLongPress={handleLongPress}
            delayLongPress={250}
            disabled={item?.status === "sending"}
            style={[
              styles.fileBubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
            ]}
          >
            <ReplyPreview
              replyTo={item.replyTo}
              isMine={isMine}
              onPress={onPressReplyPreview}
              userInfo={userInfo}
            />

            <View style={styles.fileRow}>
              <View
                style={[
                  styles.fileIconBox,
                  {
                    backgroundColor: isMine
                      ? "rgba(255,255,255,0.18)"
                      : `${fileConfig.color}18`,
                  },
                ]}
              >
                {item?.status === "sending" || isDownloadingFile ? (
                  <ActivityIndicator
                    size="small"
                    color={isMine ? "#FFF" : fileConfig.color}
                  />
                ) : (
                  <Ionicons
                    name={fileConfig.icon}
                    size={22}
                    color={isMine ? "#FFF" : fileConfig.color}
                  />
                )}
              </View>

              <View style={styles.fileInfo}>
                <Text
                  style={[
                    styles.fileName,
                    isMine ? styles.messageTextMine : styles.messageTextOther,
                  ]}
                  numberOfLines={2}
                >
                  {item?.attachment?.originalName ?? "Tệp đính kèm"}
                </Text>
                <Text
                  style={[
                    styles.fileMeta,
                    isMine ? styles.timeTextMine : styles.timeTextOther,
                  ]}
                  numberOfLines={1}
                >
                  {[
                    getFileExt(item?.attachment?.originalName),
                    formatFileSize(item?.attachment?.size),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {item?.status === "sending"
                    ? " · Đang gửi..."
                    : isDownloadingFile
                      ? " · Đang tải..."
                      : ""}
                </Text>
              </View>

              {item?.status !== "sending" && !isDownloadingFile && (
                <Ionicons
                  name="download-outline"
                  size={18}
                  color={isMine ? "rgba(255,255,255,0.85)" : "#6B7280"}
                />
              )}
            </View>

            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.timeText,
                  isMine ? styles.timeTextMine : styles.timeTextOther,
                ]}
              >
                {resolveMessageTime(item)}
              </Text>
              {isMine && !!statusText && item?.status !== "sending" && (
                <Text style={[styles.statusText, styles.timeTextMine]}>
                  {statusText}
                </Text>
              )}
            </View>

            {!isRecalled && (
              <ReactionSummaryBadge
                reactions={item?.reactions}
                isMine={isMine}
                onPress={() => onPressReactionSummary?.(item?.reactions)}
              />
            )}
          </TouchableOpacity>
        ) : (
          <Animated.View style={highlightStyle}>
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

              {!isRecalled && (
                <ReactionSummaryBadge
                  reactions={item?.reactions}
                  isMine={isMine}
                  onPress={() => onPressReactionSummary?.(item?.reactions)}
                  isImage={isImage}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
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

  fileBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "relative",
    minWidth: 220,
    maxWidth: 260,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  fileMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
