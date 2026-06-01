import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

import chatApi from "../../../api/chat";
import { upsertConversation } from "../../../redux/slice/chatSlice";

export default function GroupChatSettingsScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { conversationId, conversation: initialConversation } =
    route.params ?? {};

  const initialName = useMemo(
    () => initialConversation?.name ?? initialConversation?.display_name ?? "",
    [initialConversation],
  );

  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSave = async () => {
    const nextName = name.trim();
    if (!conversationId || !nextName || saving) return;

    setSaving(true);
    try {
      const res = await chatApi.updateGroupConversationName(conversationId, {
        name: nextName,
      });
      const updatedConversation = res?.data?.data ?? res?.data ?? res;

      if (updatedConversation) {
        dispatch(upsertConversation(updatedConversation));
      }

      Toast.show({ type: "success", text1: "Đã đổi tên nhóm" });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Không thể đổi tên nhóm",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Cài đặt nhóm</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Tên nhóm</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên nhóm"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            maxLength={80}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!name.trim() || saving) && styles.saveButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  flex: { flex: 1 },
  header: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    color: "#111827",
    fontSize: 15,
  },
  saveButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
