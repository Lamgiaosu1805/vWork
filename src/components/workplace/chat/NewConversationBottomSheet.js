import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import BottomSheet from "../../crm/BottomSheet";
import { withTiming } from "react-native-reanimated";
import { HEIGHT_SHEET } from "../../../screens/crm/CustomerScreen";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useUser from "../../../hooks/useUser";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
} from "react-native-reanimated";
import { AuthAvatar } from "../../PostCard";
import OptionRow from "./OptionRow";
import ContactRow from "./ContactRow";
import { ScrollView } from "react-native";

const NewConversationBottomSheet = ({ translateNewConversation, onSelect }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef(null);
  const { getUsers, loading } = useUser();
  const scrollY = useSharedValue(0);
  const [groupMode, setGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [showGroupName, setShowGroupName] = useState(false);
  const [groupName, setGroupName] = useState("");

  const handleClose = useCallback(
    (isGesture, shouldClose) => {
      // only reset state when not a gesture (overlay/back/programmatic close)
      if (!isGesture) {
        translateNewConversation.value = withTiming(HEIGHT_SHEET);
      }

      if (shouldClose) {
        setGroupMode(false);
        setSelectedUsers([]);
        setShowGroupName(false);
        setGroupName("");
      }

      Keyboard.dismiss();
    },
    [translateNewConversation, setGroupMode, setSelectedUsers],
  );

  const handleSelect = (item) => {
    console.log(item);

    if (groupMode) {
      // toggle selection
      const exists = selectedUsers.find(
        (u) => u.id_account?._id === item.id_account?._id,
      );
      console.log(item);

      if (exists) {
        setSelectedUsers((prev) =>
          prev.filter((u) => u.id_account?._id !== item.id_account?._id),
        );
      } else {
        setSelectedUsers((prev) => [...prev, item]);
      }
      return;
    }

    onSelect(item);
    Keyboard.dismiss();
    handleClose();
  };

  const handleStartGroup = () => {
    setGroupMode(true);
    setSelectedUsers([]);
  };

  const submitCreateGroup = () => {
    if (!selectedUsers.length) return;
    const name = groupName?.trim();
    const nameGroupEmpty =
      name ||
      selectedUsers
        .map((m) => (m?.full_name ? m.full_name.trim().split(/\s+/).pop() : ""))
        .filter(Boolean)
        .join(", ");
    if (!nameGroupEmpty) return;

    console.log(nameGroupEmpty);

    onSelect?.({ type: "group", members: selectedUsers, name: nameGroupEmpty });
    handleClose(false);
  };

  const removeSelected = (id) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id_account?._id !== id));
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (page > 1) setLoadingMore(true);
        const params = { page, limit: 30, isFull: "true" };
        if (query) params.search = query;
        const res = await getUsers(params);

        if (page === 1) {
          setUsers(res?.data?.data);
        } else {
          setUsers((prev) => [...prev, ...res?.data?.data]);
        }

        const total =
          res?.data?.pagination?.total_pages ??
          res?.data?.pagination?.total_pages ??
          1;
        setTotalPages(total);
      } catch (e) {
        if (page === 1) setUsers([]);
      } finally {
        setLoadingMore(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, page]);

  // Reset to first page when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  const handleLoadMore = () => {
    if (loadingMore || loading) return;
    if (page < totalPages) setPage((p) => p + 1);
  };

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;

    const layoutHeight = event.layoutMeasurement.height;
    const contentHeight = event.contentSize.height;
    const distanceFromBottom =
      contentHeight - layoutHeight - event.contentOffset.y;

    if (distanceFromBottom < 120) {
      runOnJS(handleLoadMore)();
    }
  });

  return (
    <BottomSheet
      onClose={handleClose}
      translateY={translateNewConversation}
      backgroundColor="#fff"
      scrollY={scrollY}
    >
      <View
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (showGroupName) {
                setShowGroupName(false);
              } else if (groupMode) {
                setGroupMode(false);
                setSelectedUsers([]);
              } else {
                handleClose(false);
              }
            }}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>Hủy</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Tin nhắn mới</Text>

          <View style={styles.headerRight}>
            {groupMode ? (
              <TouchableOpacity
                onPress={() =>
                  groupMode && showGroupName
                    ? submitCreateGroup()
                    : setShowGroupName(true)
                }
                disabled={selectedUsers.length <= 1}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  opacity: selectedUsers.length <= 1 ? 0.4 : 1,
                }}
              >
                <Text style={[styles.headerBtnText, { fontWeight: "700" }]}>
                  {showGroupName ? "Tạo" : "Tiếp"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {showGroupName ? (
          <View style={styles.groupNameWrap}>
            <Text style={styles.groupNameLabel}>Tên nhóm</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Nhập tên nhóm"
              placeholderTextColor="#9CA3AF"
              style={styles.groupNameInput}
              returnKeyType="done"
            />
          </View>
        ) : null}

        {!showGroupName && (
          <View style={styles.searchWrap}>
            <Ionicons
              name="search"
              size={18}
              color="#9CA3AF"
              style={{ marginLeft: 10 }}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm kiếm hoặc chọn liên hệ"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        )}

        {groupMode && selectedUsers.length > 0 ? (
          <View style={styles.selectedWrap}>
            <ScrollView
              contentContainerStyle={{ gap: 10 }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {selectedUsers.map((u) => (
                <View key={u.id_account?._id} style={styles.selectedItem}>
                  <AuthAvatar
                    filename={u.avatar}
                    name={u.full_name}
                    size={56}
                  />

                  <Text
                    numberOfLines={2}
                    style={{ fontSize: 13, fontWeight: "400", color: "#000" }}
                  >
                    {u.full_name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeSelected(u.id_account?._id)}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <Animated.ScrollView
          bounces={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled
        >
          {!groupMode && (
            <View style={styles.options}>
              <OptionRow
                icon="people"
                label="Nhóm chat"
                onPress={handleStartGroup}
              />
            </View>
          )}
          {!showGroupName && (
            <>
              <Text style={styles.suggestTitle}>Gợi ý</Text>

              {users.length === 0 ? (
                <View style={styles.emptyWrap}>
                  {loading ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.emptyText}>Không có liên hệ</Text>
                  )}
                </View>
              ) : (
                <View>
                  {users.map((item, index) => {
                    const id = item.id_account?._id;
                    const isSelected = selectedUsers.find(
                      (u) => u.id_account?._id === id,
                    );
                    return (
                      <View key={item.id_account?._id ?? index.toString()}>
                        <ContactRow
                          item={item}
                          onPress={handleSelect}
                          selected={!!isSelected}
                          groupMode={groupMode}
                        />
                        {index < users.length - 1 ? (
                          <View style={styles.divider} />
                        ) : null}
                      </View>
                    );
                  })}

                  {loadingMore ? (
                    <ActivityIndicator style={{ margin: 12 }} />
                  ) : null}
                </View>
              )}
            </>
          )}
        </Animated.ScrollView>
      </View>
    </BottomSheet>
  );
};

export default NewConversationBottomSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  headerBtnText: { color: "#0F766E", fontSize: 16, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  headerRight: { width: 56 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    color: "#111827",
    fontSize: 15,
  },

  options: { marginBottom: 8 },
  list: { flex: 1 },
  listContent: { paddingBottom: 12 },

  selectedWrap: { paddingVertical: 12 },
  selectedItem: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  removeBtn: {
    position: "absolute",
    right: 8,
    top: 0,
    backgroundColor: "#0F766E",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  suggestTitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 8,
  },
  emptyWrap: { height: 120, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#6B7280" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 56 },
  groupNameWrap: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  groupNameLabel: {
    color: "#6B7280",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  groupNameInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
});
