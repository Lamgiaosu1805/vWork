import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/axiosInstance";

const SUGGESTIONS = [
  "Khách hàng nào chưa đầu tư lần nào?",
  "Tổng hoa hồng tháng này của tôi?",
  "Khách hàng có khoản đầu tư lớn nhất?",
  "Danh sách khách hàng mới nhất?",
];

export default function AiChatbotModal() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    Keyboard.dismiss();
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    scrollToBottom();

    try {
      const res = await api.post(
        "/ai/chat",
        { messages: newMessages },
        { requiresAuth: true },
      );
      const reply = res.data?.reply ?? "Không có phản hồi.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lỗi kết nối. Vui lòng thử lại." },
      ]);
      console.log("AiChatbot error:", err.message);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, messages, loading, scrollToBottom]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setMessages([]);
    setInput("");
  }, []);

  const renderMessage = useCallback(({ item }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={14} color="#fff" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }, []);

  return (
    <>
      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="sparkles" size={16} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Trợ lý CRM</Text>
                <Text style={styles.headerSub}>Hỏi về khách hàng, doanh số, hoa hồng...</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="sparkles" size={28} color="#fff" />
                </View>
                <Text style={styles.emptyTitle}>Xin chào! Tôi có thể giúp gì?</Text>
                <Text style={styles.emptyDesc}>Hỏi tôi về khách hàng, hoa hồng, doanh số...</Text>
                <View style={styles.suggestionsContainer}>
                  {SUGGESTIONS.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestionChip}
                      onPress={() => sendMessage(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
          />

          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingRow}>
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={14} color="#fff" />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#6B7280" />
                <Text style={styles.loadingText}>Đang trả lời...</Text>
              </View>
            </View>
          )}

          {/* Input — marginBottom đẩy lên trên bàn phím */}
          <View style={[styles.inputRow, { marginBottom: kbHeight }]}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Nhập câu hỏi..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0055ba",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0055ba",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },

  modalContainer: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0055ba",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },

  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  emptyContainer: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0055ba",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  suggestionsContainer: { width: "100%", gap: 8 },
  suggestionChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: { fontSize: 13, color: "#374151", fontWeight: "500" },

  msgRow: { marginBottom: 12, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowBot: { justifyContent: "flex-start" },

  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0055ba",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  bubble: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: "#0055ba", borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: "#fff", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextBot: { color: "#111827" },

  loadingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  loadingText: { fontSize: 13, color: "#6B7280" },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0055ba",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#93C5FD" },
});
