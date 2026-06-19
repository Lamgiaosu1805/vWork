import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthAvatar } from "../../../PostCard";
import chatApi from "../../../../api/chat";

const AddMembersModal = ({
  visible,
  existingMemberIds = [],
  onClose,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  const existingSet = useMemo(
    () => new Set(existingMemberIds.map(String)),
    [existingMemberIds],
  );

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setResults([]);
      setSelectedIds(new Set());
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await chatApi.searchUsers({ search, limit: 20 });
        const users = res?.data?.data ?? res?.data ?? [];
        setResults(Array.isArray(users) ? users : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, visible]);

  const toggleSelect = (userId) => {
    const key = String(userId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit?.(Array.from(selectedIds));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Huỷ</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Thêm thành viên</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.headerBtn}
            disabled={selectedIds.size === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#0F766E" />
            ) : (
              <Text
                style={[
                  styles.doneText,
                  selectedIds.size === 0 && styles.doneTextDisabled,
                ]}
              >
                Xong{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên hoặc mã nhân viên"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoFocus
          />
        </View>

        {searching ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#0F766E" />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item?._id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            renderItem={({ item }) => {
              const userId = String(item?._id);
              const alreadyMember = existingSet.has(userId);
              const selected = selectedIds.has(userId);

              return (
                <TouchableOpacity
                  style={styles.row}
                  disabled={alreadyMember}
                  onPress={() => toggleSelect(userId)}
                  activeOpacity={0.7}
                >
                  <AuthAvatar
                    filename={item.avatar}
                    name={item.full_name}
                    size={42}
                  />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.full_name}
                    </Text>
                    {item.ma_nv && (
                      <Text style={styles.rowSub}>{item.ma_nv}</Text>
                    )}
                  </View>

                  {alreadyMember ? (
                    <Text style={styles.alreadyText}>Đã ở trong nhóm</Text>
                  ) : (
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={selected ? "#0F766E" : "#D1D5DB"}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {search ? "Không tìm thấy người dùng" : "Nhập để tìm kiếm"}
              </Text>
            }
          />
        )}
      </View>
    </Modal>
  );
};

export default AddMembersModal;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  headerBtn: { minWidth: 60, paddingVertical: 6 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cancelText: { fontSize: 15, color: "#6B7280" },
  doneText: {
    fontSize: 15,
    color: "#0F766E",
    fontWeight: "700",
    textAlign: "right",
  },
  doneTextDisabled: { color: "#D1D5DB" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  loadingWrap: { paddingTop: 40, alignItems: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  rowSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  alreadyText: { fontSize: 12, color: "#9CA3AF" },

  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 40,
  },
});
