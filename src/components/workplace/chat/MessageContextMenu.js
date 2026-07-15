import BlurView from "@sbaiahmed1/react-native-blur";
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveDisplayName } from "../../../hooks/workplace/useNicknameMap";
import ReplyPreview from "./ReplyPreview";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export const REACTIONS = [
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😆" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
  { type: "like", emoji: "👍" },
];

const REACTION_ROW_HEIGHT = 56;
const REACTION_ROW_WIDTH = 300;
const MENU_WIDTH = 230;
const GAP = 10;

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const buildMentionSegments = (content, mentions, nicknameMap) => {
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

const MessageContextMenu = ({
  visible,
  onClose,
  layout,
  preview,
  onSelectReaction,
  menuActions = [],
  nicknameMap,
  userInfo,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible || !layout || !preview) return null;

  const {
    pageX: bubbleLeft,
    pageY: bubbleTop,
    width: bubbleWidth,
    height: bubbleHeight,
  } = layout;
  const {
    isMine,
    isImage,
    isFile,
    imageUri,
    imageHeaders,
    text,
    isRecalled,
    mentions,
    replyTo,
    reactions = [],
    fileName,
    fileSize,
    fileIcon,
    fileColor,
  } = preview;

  const menuHeight = menuActions.length * 48 + 8;

  const spaceBelow = SCREEN_HEIGHT - (bubbleTop + bubbleHeight) - insets.bottom;
  const spaceAbove = bubbleTop - insets.top;

  let reactionRowTop;
  let menuTop;

  if (spaceBelow >= REACTION_ROW_HEIGHT + GAP + menuHeight + GAP) {
    reactionRowTop = Math.max(
      insets.top + 8,
      bubbleTop - REACTION_ROW_HEIGHT - GAP,
    );
    menuTop = bubbleTop + bubbleHeight + GAP;
  } else if (spaceAbove >= REACTION_ROW_HEIGHT + GAP + menuHeight + GAP) {
    menuTop = Math.max(insets.top + 8, bubbleTop - GAP - menuHeight);
    reactionRowTop = menuTop - REACTION_ROW_HEIGHT - GAP;
  } else {
    reactionRowTop = Math.max(
      insets.top + 8,
      bubbleTop - REACTION_ROW_HEIGHT - GAP,
    );
    menuTop = Math.min(
      SCREEN_HEIGHT - insets.bottom - menuHeight - 8,
      bubbleTop + bubbleHeight + GAP,
    );
  }

  const reactionRowLeft = clamp(
    isMine ? bubbleLeft + bubbleWidth - REACTION_ROW_WIDTH : bubbleLeft,
    12,
    SCREEN_WIDTH - REACTION_ROW_WIDTH - 12,
  );

  const menuLeft = clamp(
    isMine ? bubbleLeft + bubbleWidth - MENU_WIDTH : bubbleLeft,
    12,
    SCREEN_WIDTH - MENU_WIDTH - 12,
  );

  const myReaction = reactions.find(
    (r) => String(r.userId?._id) === String(userInfo?._id),
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      >
        <View />
        <BlurView
          blurAmount={45}
          blurType="dark"
          style={StyleSheet.absoluteFill}
        />
      </TouchableOpacity>

      {!isRecalled && (
        <Animated.View
          entering={ZoomIn.duration(150)}
          style={[
            styles.reactionRow,
            { top: reactionRowTop, left: reactionRowLeft },
          ]}
        >
          {REACTIONS.map((r) => {
            const selected = myReaction?.type === r.type;

            return (
              <TouchableOpacity
                key={r.type}
                onPress={() => onSelectReaction?.(r.type)}
                style={styles.reactionBtn}
              >
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>

                {selected && (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 6,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}

      <View
        pointerEvents="none"
        style={[
          styles.bubblePreviewWrap,
          {
            top: bubbleTop,
            left: bubbleLeft,
            width: bubbleWidth,
            alignItems: isMine ? "flex-end" : "flex-start",
          },
        ]}
      >
        {isRecalled ? (
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMine ? styles.textMine : styles.textOther,
              ]}
            >
              Tin nhắn đã được thu hồi
            </Text>
          </View>
        ) : isImage ? (
          <Image
            source={{ uri: imageUri, headers: imageHeaders }}
            style={{
              width: bubbleWidth,
              height: bubbleHeight,
              borderRadius: 14,
            }}
          />
        ) : isFile ? (
          <View
            style={[
              styles.fileBubble,
              { width: bubbleWidth, minHeight: bubbleHeight },
              isMine ? styles.bubbleMine : styles.bubbleOther,
            ]}
          >
            <ReplyPreview
              replyTo={replyTo}
              isMine={isMine}
              userInfo={userInfo}
            />

            <View style={styles.fileRow}>
              <View
                style={[
                  styles.fileIconBox,
                  {
                    backgroundColor: isMine
                      ? "rgba(255,255,255,0.18)"
                      : `${fileColor ?? "#6B7280"}18`,
                  },
                ]}
              >
                <Ionicons
                  name={fileIcon ?? "document"}
                  size={22}
                  color={isMine ? "#FFF" : (fileColor ?? "#6B7280")}
                />
              </View>

              <View style={styles.fileInfo}>
                <Text
                  style={[
                    styles.fileName,
                    isMine ? styles.textMine : styles.textOther,
                  ]}
                  numberOfLines={2}
                >
                  {fileName ?? "Tệp đính kèm"}
                </Text>
                {!!fileSize && (
                  <Text
                    style={[
                      styles.fileMeta,
                      isMine ? styles.textMine : styles.textOther,
                    ]}
                    numberOfLines={1}
                  >
                    {formatFileSize(fileSize)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
            ]}
          >
            <ReplyPreview
              replyTo={replyTo}
              isMine={isMine}
              userInfo={userInfo}
            />

            <Text
              style={[
                styles.messageText,
                isMine ? styles.messageTextMine : styles.messageTextOther,
              ]}
            >
              {buildMentionSegments(text, mentions, nicknameMap).map(
                (seg, idx) => (
                  <Text
                    key={idx}
                    style={seg.isMention && styles.mentionText}
                    suppressHighlighting={seg.isMention}
                  >
                    {seg.text}
                  </Text>
                ),
              )}
            </Text>
          </View>
        )}
      </View>

      <Animated.View
        entering={FadeIn.duration(150)}
        style={[
          styles.menuCard,
          { top: menuTop, left: menuLeft, width: MENU_WIDTH },
        ]}
      >
        {menuActions.map((action, idx) => (
          <TouchableOpacity
            key={action.key}
            style={[
              styles.menuItem,
              idx < menuActions.length - 1 && styles.menuItemBorder,
            ]}
            onPress={() => {
              onClose();
              action.onPress?.();
            }}
          >
            <Text
              style={[
                styles.menuItemText,
                action.destructive && styles.menuItemDestructive,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  );
};

export default MessageContextMenu;

const styles = StyleSheet.create({
  reactionRow: {
    position: "absolute",
    width: REACTION_ROW_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(50,50,55,0.9)",
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 100,
  },
  reactionBtn: { padding: 4, alignItems: "center", gap: 2 },
  reactionEmoji: { fontSize: 28 },

  bubblePreviewWrap: { position: "absolute" },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: { backgroundColor: "#0F766E", borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  textMine: { color: "#FFF" },
  textOther: { color: "#111827" },
  messageTextMine: { color: "#FFF" },
  messageTextOther: { color: "#111827" },
  mentionText: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  // ---- File preview ----
  fileBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
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
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  fileMeta: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },

  menuCard: {
    position: "absolute",
    backgroundColor: "rgba(40,40,45,0.95)",
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  menuItemText: { fontSize: 16, color: "#FFF" },
  menuItemDestructive: { color: "#FF453A" },
});
