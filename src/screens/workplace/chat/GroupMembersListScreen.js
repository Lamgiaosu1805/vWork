import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

import chatApi from "../../../api/chat";
import { upsertConversation } from "../../../redux/slice/chatSlice";
import { AuthAvatar } from "../../../components/PostCard";
import NicknameModal from "../../../components/workplace/chat/setting/NicknameModal";
import {
  resolveDisplayName,
  useNicknameMap,
} from "../../../hooks/workplace/useNicknameMap";

export default function GroupMembersListScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const {
    conversationId,
    members: initialMembers,
    admins: initialAdmins,
    currentUserInfoId,
    isCurrentUserAdmin,
  } = route.params ?? {};

  const [members, setMembers] = useState(initialMembers ?? []);
  const [admins, setAdmins] = useState(initialAdmins ?? []);
  const [search, setSearch] = useState("");
  const [memberActionId, setMemberActionId] = useState(null);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nicknameMember, setNicknameMember] = useState(null);
  const [conversation, setConversation] = useState(route.params?.conversation);
  const [nicknameSaving, setNicknameSaving] = useState(false);

  const nicknameMap = useNicknameMap(conversation);

  const adminIds = useMemo(
    () => new Set((admins ?? []).map((a) => String(a?._id ?? a))),
    [admins],
  );

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        const aA = adminIds.has(String(a?._id)) ? 0 : 1;
        const bA = adminIds.has(String(b?._id)) ? 0 : 1;
        return aA - bA;
      }),
    [members, adminIds],
  );

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sortedMembers;
    return sortedMembers.filter((m) =>
      String(m?.full_name ?? "")
        .toLowerCase()
        .includes(keyword),
    );
  }, [sortedMembers, search]);

  const handleOpenNicknameModal = useCallback((member) => {
    if (!member) return;
    setNicknameMember(member);
    setNicknameModalVisible(true);
  }, []);

  const applyUpdate = useCallback(
    (updated) => {
      if (!updated) return;

      dispatch(upsertConversation(updated));
      setConversation(updated);

      if (updated.members) setMembers(updated.members);
      if (updated.admins) setAdmins(updated.admins);
    },
    [dispatch],
  );

  const handleCloseNicknameModal = useCallback(() => {
    setNicknameModalVisible(false);
    setNicknameMember(null);
  }, []);

  const handleSaveNickname = useCallback(
    async (nicknameValue) => {
      if (!conversationId || !nicknameMember?._id || nicknameSaving) return;

      setNicknameSaving(true);

      try {
        const res = await chatApi.updateMemberNickname(
          conversationId,
          nicknameMember._id,
          nicknameValue,
        );

        const updated = res?.data?.data ?? res?.data ?? res;

        applyUpdate(updated);

        handleCloseNicknameModal();

        Toast.show({
          type: "success",
          text1: "Đã cập nhật biệt danh",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1:
            error?.response?.data?.message ??
            error?.message ??
            "Không thể cập nhật biệt danh",
        });
      } finally {
        setNicknameSaving(false);
      }
    },
    [
      conversationId,
      nicknameMember,
      nicknameSaving,
      applyUpdate,
      handleCloseNicknameModal,
    ],
  );
  const handleKickMember = useCallback(
    (member) => {
      const memberId = String(member?._id);
      Alert.alert(
        "Xoá thành viên",
        `Xoá ${member?.full_name ?? "thành viên này"} khỏi nhóm?`,
        [
          { text: "Huỷ", style: "cancel" },
          {
            text: "Xoá",
            style: "destructive",
            onPress: async () => {
              setMemberActionId(memberId);
              try {
                const res = await chatApi.kickMember(conversationId, memberId);
                applyUpdate(res?.data?.data ?? res?.data ?? res);
                Toast.show({ type: "success", text1: "Đã xoá thành viên" });
              } catch (error) {
                Toast.show({
                  type: "error",
                  text1:
                    error?.response?.data?.message ??
                    error?.message ??
                    "Không thể xoá thành viên",
                });
              } finally {
                setMemberActionId(null);
              }
            },
          },
        ],
      );
    },
    [conversationId, applyUpdate],
  );

  const handlePromoteMember = useCallback(
    (member) => {
      const memberId = String(member?._id);
      Alert.alert(
        "Thăng chức trưởng nhóm",
        `Đặt ${member?.full_name ?? "thành viên này"} làm trưởng nhóm?`,
        [
          { text: "Huỷ", style: "cancel" },
          {
            text: "Xác nhận",
            onPress: async () => {
              setMemberActionId(memberId);
              try {
                const res = await chatApi.promoteMember(
                  conversationId,
                  memberId,
                );
                applyUpdate(res?.data?.data ?? res?.data ?? res);
                Toast.show({
                  type: "success",
                  text1: "Đã thăng chức trưởng nhóm",
                });
              } catch (error) {
                Toast.show({
                  type: "error",
                  text1:
                    error?.response?.data?.message ??
                    error?.message ??
                    "Không thể thăng chức",
                });
              } finally {
                setMemberActionId(null);
              }
            },
          },
        ],
      );
    },
    [conversationId, applyUpdate],
  );

  const handleMemberOptions = useCallback(
    (member, isMe, isMemberAdmin) => {
      const buttons = [];

      buttons.push({
        text: "Xem trang cá nhân",
        onPress: () =>
          navigation.navigate("WorkplaceProfileScreen", {
            accountId: member?.id_account,
          }),
      });

      buttons.push({
        text: "Biệt danh",
        onPress: () => handleOpenNicknameModal(member),
      });

      if (isCurrentUserAdmin && !isMe && !isMemberAdmin) {
        buttons.push({
          text: "Đặt làm trưởng nhóm",
          onPress: () => handlePromoteMember(member),
        });
        buttons.push({
          text: "Xoá khỏi nhóm",
          style: "destructive",
          onPress: () => handleKickMember(member),
        });
      }

      buttons.push({ text: "Huỷ", style: "cancel" });

      Alert.alert(member?.full_name ?? "Thành viên", null, buttons);
    },
    [isCurrentUserAdmin, navigation, handlePromoteMember, handleKickMember],
  );

  const renderItem = useCallback(
    ({ item: m, index: idx }) => {
      const isAdmin = adminIds.has(String(m?._id));
      const isMe = String(m?._id) === String(currentUserInfoId);
      const isProcessing = memberActionId === String(m?._id);
      const hasNickname = !!nicknameMap.get(String(m?._id));
      
      return (
        <View style={[styles.memberRow, idx > 0 && styles.memberBorder]}>
          <View style={styles.memberAvWrap}>
            <AuthAvatar
              filename={m.avatar}
              name={m.full_name}
              size={44}
              cacheKey={m.updatedAt}
            />
            {isAdmin && (
              <View style={styles.crownBadge}>
                <Ionicons name="star" size={8} color="#FFF" />
              </View>
            )}
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName} numberOfLines={1}>
              {resolveDisplayName(
                nicknameMap,
                m?._id,
                m?.full_name ?? "Thành viên",
              )}
              {isMe ? " (Bạn)" : ""}
            </Text>

            <Text numberOfLines={1} style={styles.memberRole}>
              {hasNickname ? m.full_name : "Chưa có biệt danh"}
            </Text>
            <Text style={isAdmin ? styles.memberRoleAdmin : styles.memberRole}>
              {isAdmin ? "Trưởng nhóm" : "Thành viên"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handleMemberOptions(m, isMe, isAdmin)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Ionicons
              name="ellipsis-horizontal-circle-outline"
              size={30}
              color={"#0F766E"}
            />
          </TouchableOpacity>
        </View>
      );
    },
    [adminIds, currentUserInfoId, memberActionId, handleMemberOptions],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thành viên ({members.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm thành viên..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(m, idx) => String(m?._id ?? idx)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {search ? "Không tìm thấy thành viên" : "Không có thành viên"}
          </Text>
        }
      />

      <NicknameModal
        visible={nicknameModalVisible}
        member={nicknameMember}
        initialValue={
          resolveDisplayName(nicknameMap, nicknameMember?._id, "") ===
          nicknameMember?.full_name
            ? ""
            : (nicknameMap.get(String(nicknameMember?._id)) ?? "")
        }
        onClose={handleCloseNicknameModal}
        onSave={handleSaveNickname}
        saving={nicknameSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#111827" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  memberBorder: {
    borderTopWidth: 0.5,
    borderTopColor: "#F3F4F6",
  },
  memberAvWrap: { position: "relative", width: 44, height: 44 },
  crownBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  memberInfo: { flex: 1, gap: 3 },
  memberName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  memberRole: { fontSize: 12, color: "#9CA3AF" },
  memberRoleAdmin: { fontSize: 12, color: "#0F766E", fontWeight: "500" },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 24,
  },
});
