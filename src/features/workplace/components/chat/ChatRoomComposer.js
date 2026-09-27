import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ChatRoomComposer = ({ text, setText, sending, onSend, bottomInset }) => {
  return (
    <View
      style={[
        styles.composer,
        {
          paddingBottom: Math.max(bottomInset + 8, 12),
        },
      ]}
    >
      <View style={styles.inputWrap}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
          maxLength={4000}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!text.trim() || sending) && styles.sendButtonDisabled,
        ]}
        disabled={!text.trim() || sending}
        onPress={onSend}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="send" size={18} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ChatRoomComposer;

const styles = StyleSheet.create({
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  inputWrap: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },

  input: {
    minHeight: 24,
    maxHeight: 120,
    color: "#111827",
    fontSize: 15,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F766E",
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },
});
