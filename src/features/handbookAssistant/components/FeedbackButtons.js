import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { COLORS } from "../../../assets/theme/colors";
import useMessageFeedback from "../hooks/useMessageFeedback";

const ICON = COLORS.neutral.neutral500;

const FeedbackButtons = ({ message, conversationKey }) => {
  const feedback = useMessageFeedback(conversationKey);
  const [copied, setCopied] = useState(false);
  const value = message.feedback ?? null;

  const send = (next) => {
    if (feedback.isPending || value === next) return;
    feedback.mutate({ messageId: message.id, value: next, previous: value });
  };

  const copy = async () => {
    await Clipboard.setStringAsync(message.content ?? "");
    setCopied(true);
    Toast.show({ type: "success", text1: "Đã sao chép câu trả lời", visibilityTime: 1500 });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={copy} hitSlop={8} accessibilityLabel="Sao chép câu trả lời">
        <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={ICON} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => send(1)}
        hitSlop={8}
        disabled={feedback.isPending}
        accessibilityLabel="Câu trả lời hữu ích"
        accessibilityState={{ selected: value === 1 }}
      >
        <Ionicons
          name={value === 1 ? "thumbs-up" : "thumbs-up-outline"}
          size={16}
          color={value === 1 ? COLORS.Primary : ICON}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => send(-1)}
        hitSlop={8}
        disabled={feedback.isPending}
        accessibilityLabel="Câu trả lời chưa chính xác"
        accessibilityState={{ selected: value === -1 }}
      >
        <Ionicons
          name={value === -1 ? "thumbs-down" : "thumbs-down-outline"}
          size={16}
          color={value === -1 ? COLORS.Primary : ICON}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
});

export default FeedbackButtons;
