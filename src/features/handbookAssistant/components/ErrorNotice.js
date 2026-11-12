import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { COLORS } from "../../../assets/theme/colors";
import { getErrorInfo } from "../constants";
import { askInNewConversation, retryTurn } from "../lib/streamController";

const TONE = {
  error: { bg: "#FEF2F2", border: "#FCA5A5", fg: "#B91C1C", icon: "alert-circle-outline" },
  warning: { bg: "#FFFBEB", border: "#FCD34D", fg: "#B45309", icon: "warning-outline" },
  info: { bg: "#EFF6FF", border: "#93C5FD", fg: "#1D4ED8", icon: "information-circle-outline" },
};

const ErrorNotice = ({ message, isStreaming, quota }) => {
  if (message.status === "cancelled") {
    return (
      <View style={[styles.cancelled, message.content ? { marginTop: 6 } : null]}>
        <Ionicons name="stop-circle-outline" size={13} color={COLORS.neutral.neutral500} />
        <Text style={styles.cancelledText}>Đã dừng trả lời</Text>
      </View>
    );
  }

  const info = getErrorInfo(message.errorCode);
  const tone = TONE[info.severity] ?? TONE.error;
  const canAct = !isStreaming && Boolean(message.question);
  const hasAction = canAct && (info.action === "retry" || info.action === "new_conversation");

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: tone.bg, borderColor: tone.border },
        message.content ? { marginTop: 8 } : null,
      ]}
    >
      <View style={styles.titleRow}>
        <Ionicons name={tone.icon} size={16} color={tone.fg} />
        <Text style={[styles.title, { color: tone.fg }]}>{info.title}</Text>
      </View>
      {info.message ? <Text style={styles.body}>{info.message}</Text> : null}
      {message.errorCode === "QUOTA_EXCEEDED" && quota?.resetAt ? (
        <Text style={styles.body}>
          Lượt hỏi được làm mới lúc {dayjs(quota.resetAt).format("HH:mm [ngày] DD/MM")}.
        </Text>
      ) : null}
      {hasAction && (
        <TouchableOpacity
          style={[styles.action, { borderColor: tone.fg }]}
          onPress={() =>
            info.action === "retry" ? retryTurn(message) : askInNewConversation(message.question)
          }
        >
          <Text style={[styles.actionText, { color: tone.fg }]}>
            {info.action === "retry" ? "Thử lại" : "Hỏi lại trong hội thoại mới"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cancelled: { flexDirection: "row", alignItems: "center", gap: 4 },
  cancelledText: { fontSize: 12, color: COLORS.neutral.neutral500 },
  box: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 13, fontWeight: "700", flexShrink: 1 },
  body: { fontSize: 13, color: COLORS.neutral.neutral700, lineHeight: 18 },
  action: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
});

export default ErrorNotice;
