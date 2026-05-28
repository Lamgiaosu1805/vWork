import { StyleSheet, Text, View } from "react-native";
import React, { useMemo } from "react";
import { resolveMessageText } from "../../../utils/chatUtils";
import dayjs from "dayjs";

const resolveMessageTime = (message) => {
  const value = message?.createdAt;
  return value ? dayjs(value).format("HH:mm") : "";
};

const MessageBubble = ({ item, isMine }) => {
  const statusText = useMemo(() => {
    if (!isMine) return "";
    if (item?.status === "failed") return "Gửi thất bại";
    if (item?.status === "sending") return "Đang gửi";
    if ((item?.seenBy?.length ?? 0) > 1 || item?.status === "seen")
      return "Đã xem";
    return "Đã gửi";
  }, [item, isMine]);

  return (
    <View
      style={[
        styles.messageRow,
        isMine ? styles.messageRowMine : styles.messageRowOther,
      ]}
    >
      <View
        style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}
      >
        <Text
          style={[
            styles.messageText,
            isMine ? styles.messageTextMine : styles.messageTextOther,
          ]}
        >
          {resolveMessageText(item)}
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
          {!!statusText && (
            <Text
              style={[
                styles.statusText,
                isMine ? styles.timeTextMine : styles.timeTextOther,
              ]}
            >
              {statusText}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  messageRow: { marginBottom: 10, flexDirection: "row" },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
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
});
