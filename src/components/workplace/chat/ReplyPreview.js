import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";

const ReplyPreview = ({ replyTo, isMine, onPress, userInfo }) => {
  if (!replyTo) return null;

  const isRecalledOriginal = !!replyTo?.recalled?.at;
  const senderName = replyTo?.senderId?.full_name ?? "Người dùng";
  const previewText = isRecalledOriginal
    ? "Tin nhắn đã được thu hồi"
    : replyTo?.type === "image"
      ? "[Hình ảnh]"
      : replyTo?.type === "file"
        ? `📎 ${replyTo?.attachment?.originalName ?? "Tệp đính kèm"}`
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

export default ReplyPreview;

const styles = StyleSheet.create({
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
});
