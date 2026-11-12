import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../assets/theme/colors";
import { DISCLAIMER, QUESTION_MAX_LENGTH } from "../constants";

const Composer = ({
  value,
  onChangeText,
  onSend,
  onStop,
  onNewConversation,
  streaming,
  blocked,
  quota,
  bottomInset,
}) => {
  const [height, setHeight] = useState(40);
  const outOfQuota = quota?.remaining === 0;
  const isStreaming = Boolean(streaming);
  const trimmed = value.trim();
  const canSend = Boolean(trimmed) && !isStreaming && !outOfQuota;
  const nearLimit = value.length >= QUESTION_MAX_LENGTH * 0.8;
  const lowQuota = quota && quota.remaining > 0 && quota.remaining <= 3;
  const pad = { paddingBottom: Math.max(bottomInset + 6, 10) };

  if (blocked && !isStreaming) {
    return (
      <View style={[styles.container, pad]}>
        <TouchableOpacity style={styles.newButton} onPress={onNewConversation} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
          <Text style={styles.newButtonText}>Bắt đầu hội thoại mới</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, pad]}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { height: Math.min(Math.max(40, height), 120) }]}
          value={value}
          onChangeText={onChangeText}
          onContentSizeChange={(e) => setHeight(e.nativeEvent.contentSize.height + 18)}
          placeholder={outOfQuota ? "Bạn đã hết lượt hỏi hôm nay" : "Hỏi về nội quy, giờ làm, chấm công…"}
          placeholderTextColor={COLORS.neutral.neutral400}
          editable={!outOfQuota}
          multiline
          maxLength={QUESTION_MAX_LENGTH}
          accessibilityLabel="Câu hỏi cho VINNY"
        />
        {isStreaming ? (
          <TouchableOpacity
            style={[styles.stopButton, streaming.cancelRequested && styles.disabled]}
            onPress={onStop}
            disabled={streaming.cancelRequested}
            accessibilityLabel="Dừng trả lời"
          >
            <Ionicons name="stop" size={14} color={COLORS.Primary} />
            <Text style={styles.stopText}>{streaming.cancelRequested ? "Đang dừng…" : "Dừng"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.disabled]}
            onPress={() => onSend(trimmed)}
            disabled={!canSend}
            accessibilityLabel="Gửi câu hỏi"
          >
            <Ionicons name="arrow-up" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.disclaimer} numberOfLines={2}>
          {DISCLAIMER}
        </Text>
        {(nearLimit || lowQuota) && (
          <Text style={styles.counter}>
            {lowQuota ? `Còn ${quota.remaining} lượt` : `${value.length}/${QUESTION_MAX_LENGTH}`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.neutral.neutral300,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: COLORS.neutral.neutral100,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: COLORS.neutral.neutral800,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.Primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stopButton: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.Primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stopText: { color: COLORS.Primary, fontWeight: "600", fontSize: 13 },
  disabled: { opacity: 0.45 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  disclaimer: { flex: 1, fontSize: 11, color: COLORS.neutral.neutral400 },
  counter: { fontSize: 11, color: COLORS.neutral.neutral500 },
  newButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.Primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  newButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});

export default Composer;
