import { memo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../../assets/theme/colors";
import { TRUNCATED_NOTICE } from "../constants";
import AssistantAvatar from "./AssistantAvatar";
import CitationChips from "./CitationChips";
import ErrorNotice from "./ErrorNotice";
import FeedbackButtons from "./FeedbackButtons";
import MarkdownContent from "./MarkdownContent";

const Typing = () => (
  <View style={styles.typing}>
    <ActivityIndicator size="small" color={COLORS.Primary} />
    <Text style={styles.typingText}>Đang tra cứu nội quy…</Text>
  </View>
);

// streamText chỉ truyền cho đúng tin đang chạy để các tin khác không render lại theo từng delta.
const MessageItem = ({ message, conversationKey, streamText, isStreaming, resynced, quota }) => {
  if (message.role === "user") {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const isLive = streamText !== undefined;
  const content = isLive ? streamText : message.content;
  const isFailed = message.status === "error" || message.status === "cancelled";
  const isDone = message.status === "done";
  const showTyping = isLive && (!content || resynced);

  return (
    <View style={styles.assistantRow}>
      <AssistantAvatar size={34} style={styles.avatar} />
      <View style={styles.assistantBody}>
        <View style={styles.assistantBubble}>
          {content ? <MarkdownContent content={content} streaming={isLive && !resynced} /> : null}
          {showTyping && <Typing />}
          {isDone && message.truncated && <Text style={styles.notice}>{TRUNCATED_NOTICE}</Text>}
          {isFailed && <ErrorNotice message={message} isStreaming={isStreaming} quota={quota} />}
          {isDone && <CitationChips citations={message.citations} />}
        </View>
        {isDone && message.id && <FeedbackButtons message={message} conversationKey={conversationKey} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userRow: { alignItems: "flex-end", marginVertical: 6, paddingLeft: 48 },
  userBubble: {
    backgroundColor: COLORS.Primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  userText: { color: COLORS.white, fontSize: 15, lineHeight: 21 },
  assistantRow: { flexDirection: "row", alignItems: "flex-start", marginVertical: 6, gap: 6 },
  avatar: { marginTop: 2 },
  assistantBody: { flex: 1, minWidth: 0 },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.neutral.neutral200,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 9,
  },
  typing: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  typingText: { fontSize: 13, color: COLORS.neutral.neutral500 },
  notice: { fontSize: 12, color: COLORS.neutral.neutral500, marginTop: 4, fontStyle: "italic" },
});

export default memo(MessageItem);
