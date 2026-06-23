import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
} from "react-native";
import React, { useMemo } from "react";
import { resolveMessageText } from "../../../utils/chatUtils";
import dayjs from "dayjs";
import { AuthAvatar } from "../../PostCard";
import { useSelector } from "react-redux";
import utils from "../../../helpers/utils"; // chứa BASE_URL

const resolveMessageTime = (message) => {
  const value = message?.createdAt;
  return value ? dayjs(value).format("HH:mm") : "";
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.6;

const MessageBubble = ({ item, isMine, onLongPress, sender, onPressImage }) => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  const statusText = useMemo(() => {
    if (!isMine) return "";
    if (item?.status === "failed") return "Gửi thất bại";
    if (item?.status === "queued") return "Chờ gửi";
    if (item?.status === "sending") return "Đang gửi";
    return "Đã gửi";
  }, [item, isMine]);

  const isRecalled = !!item?.recalled?.at;
  const isImage = item?.type === "image" && !isRecalled;

  const imageUri = useMemo(() => {
    if (!isImage) return null;
    console.log(item?.attachment);

    if (
      item?.status === "sending" &&
      item?.attachment?.url?.startsWith("file:")
    ) {
      return item.attachment.url;
    }

    if (!item?._id || !item?.conversationId) return null;

    return `${utils.BASE_URL}/chat/conversations/${item.conversationId}/messages/${item._id}/image`;
  }, [item, isImage]);

  const imageRatio = useMemo(() => {
    const w = item?.attachment?.width;
    const h = item?.attachment?.height;
    if (!w || !h) return 1;
    return w / h;
  }, [item]);

  return (
    <TouchableOpacity
      activeOpacity={isRecalled ? 1 : 0.7}
      style={[
        styles.messageRow,
        isMine ? styles.messageRowMine : styles.messageRowOther,
      ]}
      onLongPress={isRecalled ? undefined : onLongPress}
    >
      {!isMine && (
        <AuthAvatar
          filename={sender?.avatar}
          name={sender?.full_name}
          size={40}
          cacheKey={sender?.updatedAt}
        />
      )}

      <View
        style={[styles.column, isMine ? styles.columnMine : styles.columnOther]}
      >
        {isImage ? (
          <View style={styles.imageWrap}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => onPressImage(item._id)}
            >
              <Image
                source={{
                  uri: imageUri,
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
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
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMine ? styles.messageTextMine : styles.messageTextOther,
              ]}
            >
              {isRecalled
                ? "Tin nhắn đã được thu hồi"
                : resolveMessageText(item)}
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
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  messageRow: { marginBottom: 10, flexDirection: "row" },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },

  column: { maxWidth: "82%" },
  columnMine: { alignItems: "flex-end" },
  columnOther: { alignItems: "flex-start" },

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

  imageWrap: { borderRadius: 14, overflow: "hidden" },
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

  seenAvatarsRow: {
    flexDirection: "row",
    marginTop: 4,
    marginRight: 4,
  },
  seenAvatarWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  seenAvatarOverlap: {
    marginLeft: -6,
  },
});
