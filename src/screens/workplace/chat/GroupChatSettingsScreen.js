import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import chatApi from "../../../api/chat";
import {
  deleteConversation,
  upsertConversation,
} from "../../../redux/slice/chatSlice";
import {
  resolveConversationDisplayName,
  resolveConversationTitle,
  resolveGroupAvatars,
} from "../../../utils/chatUtils";
import { AuthAvatar } from "../../../components/PostCard";
import AvatarGroup from "../../../components/workplace/chat/AvatarGroup";
import RenameModal from "../../../components/workplace/chat/setting/RenameModal";
import MenuItem from "../../../components/workplace/chat/setting/MenuItem";
import AccordionSection from "../../../components/workplace/chat/setting/AccordionSection";
import ActionBtn from "../../../components/workplace/chat/setting/ActionBtn";
import AddMembersModal from "../../../components/workplace/chat/setting/AddMembersModal";
import NicknameModal from "../../../components/workplace/chat/setting/NicknameModal";
import NicknamePickerModal from "../../../components/workplace/chat/setting/NicknamePickerModal";
import { Edit, ImageUp } from "lucide-react-native";
import { COLORS } from "../../../assets/theme/colors";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import useGetImageMessage from "../../../hooks/useGetImageMessage";
import {
  resolveDisplayName,
  useNicknameMap,
} from "../../../hooks/workplace/useNicknameMap";
import { HEIGHT_SHEET } from "../../crm/CustomerScreen";
import { runOnJS, useSharedValue, withTiming } from "react-native-reanimated";
import MediaSection from "../../../components/workplace/chat/setting/MediaSection";

const PAGE_SIZE = 12;

export default function GroupChatSettingsScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const currentUserInfoId = useSelector(
    (state) => state.auth.user?._id ?? state.auth.user?.id,
  );

  const { conversationId, conversation: initialConversation } =
    route.params ?? {};

  const reduxConversation = useSelector((state) =>
    state.chat.conversations?.find(
      (c) => String(c?._id) === String(conversationId),
    ),
  );

  const [localConversation, setLocalConversation] = useState(
    initialConversation ?? null,
  );

  const conversation = reduxConversation ?? localConversation;
  const isGroup = conversation.type === "group";

  const [renameVisible, setRenameVisible] = useState(false);
  const [addMembersVisible, setAddMembersVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberActionId, setMemberActionId] = useState(null);

  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nicknameMember, setNicknameMember] = useState(null);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [mediaState, setMediaState] = useState({
    loading: true,
    loadingMore: false,
    images: [],
    page: 1,
    hasNext: true,
  });

  const translateNicknamePickerY = useSharedValue(HEIGHT_SHEET);

  const nicknameMap = useNicknameMap(conversation);

  const displayName = useMemo(
    () =>
      resolveConversationDisplayName(
        conversation,
        currentUserInfoId,
        nicknameMap,
      ),
    [conversation, currentUserInfoId, nicknameMap],
  );

  const members = conversation?.members ?? [];
  const adminIds = useMemo(
    () => new Set((conversation?.admins ?? []).map((a) => String(a?._id ?? a))),
    [conversation?.admins],
  );

  const isCurrentUserAdmin = adminIds.has(String(currentUserInfoId));

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        const aA = adminIds.has(String(a?._id)) ? 0 : 1;
        const bA = adminIds.has(String(b?._id)) ? 0 : 1;
        return aA - bA;
      }),
    [members, adminIds],
  );
  const { uri: groupAvatarUri, headers: groupAvatarHeaders } =
    useGetImageMessage(conversation);

  const groupAvatars =
    conversation?.type === "group" && !conversation?.avatar
      ? resolveGroupAvatars(conversation)
      : [];

  const handleSave = useCallback(
    async (nextName) => {
      if (!conversationId || !nextName || saving) return;
      setSaving(true);
      try {
        const res = await chatApi.updateGroupConversationName(conversationId, {
          name: nextName,
        });
        const updated = res?.data?.data ?? res?.data ?? res;
        if (updated) {
          dispatch(upsertConversation(updated));
          setLocalConversation((prev) => ({ ...prev, ...updated }));
        }
        setRenameVisible(false);
        Toast.show({ type: "success", text1: "Đã đổi tên nhóm" });
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
    },
    [conversationId, saving, dispatch],
  );

  const handleAddMembers = useCallback(
    async (memberIds) => {
      if (!conversationId || !memberIds?.length) return;
      try {
        const res = await chatApi.addMembers(conversationId, {
          member_ids: memberIds,
        });
        const updated = res?.data?.data ?? res?.data ?? res;
        if (updated) {
          dispatch(upsertConversation(updated));
          setLocalConversation((prev) => ({ ...prev, ...updated }));
        }
        setAddMembersVisible(false);
        Toast.show({ type: "success", text1: "Đã thêm thành viên" });
      } catch (error) {
        Toast.show({
          type: "error",
          text1:
            error?.response?.data?.message ??
            error?.message ??
            "Không thể thêm thành viên",
        });
      }
    },
    [conversationId, dispatch],
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
                const updated = res?.data?.data ?? res?.data ?? res;
                if (updated) {
                  dispatch(upsertConversation(updated));
                  setLocalConversation((prev) => ({ ...prev, ...updated }));
                }
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
    [conversationId, dispatch],
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
                const updated = res?.data?.data ?? res?.data ?? res;
                if (updated) {
                  dispatch(upsertConversation(updated));
                  setLocalConversation((prev) => ({ ...prev, ...updated }));
                }
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
    [conversationId, dispatch],
  );

  const handleOpenNicknameModal = useCallback((member) => {
    if (!member) return;
    setNicknameMember(member);
    setNicknameModalVisible(true);
  }, []);

  const handleCloseNicknameModal = useCallback(() => {
    setNicknameModalVisible(false);
    setNicknameMember(null);
  }, []);

  const handleOpenNicknamePicker = useCallback(() => {
    translateNicknamePickerY.value = withTiming(0);
  }, []);

  const handlePickMemberForNickname = useCallback(
    (member) => {
      translateNicknamePickerY.value = withTiming(
        HEIGHT_SHEET,
        { duration: 250 },
        (finished) => {
          if (finished) {
            runOnJS(handleOpenNicknameModal)(member);
          }
        },
      );
    },
    [handleOpenNicknameModal],
  );

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
        if (updated) {
          dispatch(upsertConversation(updated));
          setLocalConversation((prev) => ({ ...prev, ...updated }));
        }
        handleCloseNicknameModal();
        Toast.show({ type: "success", text1: "Đã cập nhật biệt danh" });
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
      dispatch,
      handleCloseNicknameModal,
    ],
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
    [
      adminIds,
      currentUserInfoId,
      isCurrentUserAdmin,
      navigation,
      handlePromoteMember,
      handleKickMember,
      handleOpenNicknameModal,
    ],
  );

  const handleLeaveGroup = useCallback(() => {
    Alert.alert("Rời nhóm", "Bạn có chắc muốn rời nhóm này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Rời nhóm",
        style: "destructive",
        onPress: async () => {
          setLeaving(true);
          try {
            if (navigation.canGoBack()) {
              navigation.pop(2);
            } else {
              navigation.navigate("ChatListScreen");
            }
            await chatApi.leaveGroup(conversationId);
            dispatch(deleteConversation(conversationId));
            Toast.show({ type: "success", text1: "Đã rời nhóm" });
          } catch (error) {
            Toast.show({
              type: "error",
              text1:
                error?.response?.data?.message ??
                error?.message ??
                "Không thể rời nhóm",
            });
          } finally {
            setLeaving(false);
          }
        },
      },
    ]);
  }, [conversationId, dispatch, navigation]);

  const handlePickAvatar = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Cần cấp quyền truy cập ảnh",
          "Vui lòng cấp quyền truy cập thư viện ảnh trong phần Cài đặt để thay đổi avatar.",
          [
            {
              text: "Hủy",
              style: "cancel",
            },
            {
              text: "Mở Cài đặt",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      const formData = new FormData();

      formData.append("group-avatar", {
        uri: manipulated.uri,
        name: asset.fileName ?? asset.name ?? "photo.jpg",
        type: asset.type ?? asset.mimeType ?? "image/jpeg",
      });

      const res = await chatApi.updateGroupConversationAvatar(
        conversationId,
        formData,
      );

      const updated = res?.data?.data ?? res?.data ?? res;

      if (updated) {
        dispatch(upsertConversation(updated));
        setLocalConversation((prev) => ({ ...prev, ...updated }));
      }

      Toast.show({ type: "success", text1: "Đã đổi avatar nhóm" });
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message ??
          error?.message ??
          "Không thể đổi avatar nhóm",
      });
    }
  }, [conversationId, dispatch]);

  const loadMoreConversationImages = useCallback(() => {
    if (mediaState.loading) return;
    if (mediaState.loadingMore) return;
    if (!mediaState.hasNext) return;

    loadConversationImages(mediaState.page + 1);
  }, [mediaState, loadConversationImages]);

  const handleScroll = useCallback(
    ({ nativeEvent }) => {
      if (mediaState.loading || mediaState.loadingMore || !mediaState.hasNext) {
        return;
      }

      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;

      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;

      if (isCloseToBottom) {
        loadMoreConversationImages();
      }
    },
    [mediaState, loadConversationImages],
  );

  const loadConversationImages = useCallback(
    async (pageNumber = 1) => {
      try {
        setMediaState((prev) => ({
          ...prev,
          loading: pageNumber === 1,
          loadingMore: pageNumber > 1,
        }));

        const res = await chatApi.getConversationImages(
          conversationId,
          pageNumber,
          PAGE_SIZE,
        );

        const data = res?.data?.data ?? [];
        const pagination = res?.data?.pagination ?? {};
        const hasNext = pagination.page < pagination.total_pages;

        setMediaState((prev) => ({
          ...prev,
          loading: false,
          loadingMore: false,
          page: pageNumber,
          hasNext: hasNext,
          images: pageNumber === 1 ? data : [...prev.images, ...data],
        }));
      } catch (e) {
        setMediaState((prev) => ({
          ...prev,
          loading: false,
          loadingMore: false,
        }));
      }
    },
    [conversationId],
  );

  useEffect(() => {
    loadConversationImages(1);
  }, []);

  const heroAvatar = conversation?.avatar ? (
    <AuthAvatar
      filename={conversation.avatar}
      name={displayName}
      size={88}
      cacheKey={conversation.updatedAt}
    />
  ) : groupAvatars.length > 1 ? (
    <AvatarGroup
      count={groupAvatars.length}
      groupAvatars={groupAvatars}
      width={88}
      height={88}
    />
  ) : (
    <View style={styles.heroAvatarFallback}>
      <Ionicons name="people" size={44} color="#FFF" />
    </View>
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
        <Text style={styles.headerTitle}>Thông tin nhóm</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.hero}>
          <View style={styles.heroAvatarWrap}>
            {heroAvatar}

            {isGroup && (
              <TouchableOpacity
                onPress={handlePickAvatar}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: COLORS.Primary,
                  borderRadius: 20,
                  padding: 4,
                }}
              >
                <ImageUp size={18} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.groupName} numberOfLines={1}>
              {displayName || "Nhóm chat"}
            </Text>
          </View>

          <Text style={styles.memberCount}>{members.length} thành viên</Text>
        </View>

        <View style={styles.actions}>
          <ActionBtn
            icon="notifications-outline"
            label="Thông báo"
            onPress={() => {}}
          />
          <ActionBtn
            icon="person-add-outline"
            label="Thêm"
            onPress={() => setAddMembersVisible(true)}
          />
          <ActionBtn
            icon="exit-outline"
            label="Rời nhóm"
            danger
            onPress={handleLeaveGroup}
          />
        </View>

        {isGroup && (
          <AccordionSection
            title={`Thành viên nhóm  ·  ${members.length}`}
            defaultOpen
          >
            {sortedMembers.length === 0 ? (
              <Text style={styles.emptyText}>Không có thành viên</Text>
            ) : (
              sortedMembers.slice(0, 5).map((m, idx) => {
                const isAdmin = adminIds.has(String(m?._id));
                const isMe = String(m?._id) === String(currentUserInfoId);
                const isProcessing = memberActionId === String(m?._id);
                const memberDisplayName = resolveDisplayName(
                  nicknameMap,
                  m?._id,
                  m?.full_name ?? "Thành viên",
                );
                const hasNickname = !!nicknameMap?.get(String(m?._id));

                return (
                  <View
                    key={String(m?._id ?? idx)}
                    style={[styles.memberRow, idx > 0 && styles.memberBorder]}
                  >
                    <View style={styles.memberAvWrap}>
                      <AuthAvatar
                        filename={m.avatar}
                        name={memberDisplayName}
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
                        {memberDisplayName}
                        {isMe ? " (Bạn)" : ""}
                      </Text>
                      <Text numberOfLines={1} style={styles.memberRole}>
                        {hasNickname ? m?.full_name : "Chưa có biệt danh"}
                      </Text>
                      <Text
                        style={
                          isAdmin ? styles.memberRoleAdmin : styles.memberRole
                        }
                      >
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
              })
            )}
            {members.length > 5 && (
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() =>
                  navigation.navigate("GroupMembersListScreen", {
                    conversationId,
                    members,
                    admins: conversation?.admins ?? [],
                    currentUserInfoId,
                    isCurrentUserAdmin,
                    conversation,
                  })
                }
              >
                <Text style={styles.seeAllText}>
                  Xem tất cả {members.length} thành viên
                </Text>
              </TouchableOpacity>
            )}
          </AccordionSection>
        )}

        <AccordionSection title="Thông tin về đoạn chat">
          <Text style={styles.emptyText}>
            Tạo bởi {conversation?.createdBy?.full_name ?? "—"}
          </Text>
        </AccordionSection>

        <AccordionSection title="Tuỳ chỉnh đoạn chat">
          <MenuItem
            icon="pencil-sharp"
            label="Đổi tên nhóm"
            iconBg="teal"
            onPress={() => setRenameVisible(true)}
          />
          <MenuItem
            icon="text-sharp"
            label="Biệt danh"
            iconBg="teal"
            onPress={handleOpenNicknamePicker}
          />
          <View style={styles.menuDivider} />
        </AccordionSection>

        <AccordionSection title="File phương tiện và file">
          <MediaSection
            conversationId={conversationId}
            navigation={navigation}
            images={mediaState.images}
            loading={mediaState.loading}
            loadingMore={mediaState.loadingMore}
            hasNext={mediaState.hasNext}
            onLoadMore={loadMoreConversationImages}
          />
        </AccordionSection>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      <RenameModal
        visible={renameVisible}
        initialName={displayName}
        onClose={() => setRenameVisible(false)}
        onSave={handleSave}
        saving={saving}
      />

      <AddMembersModal
        visible={addMembersVisible}
        existingMemberIds={members.map((m) => String(m?._id))}
        onClose={() => setAddMembersVisible(false)}
        onSubmit={handleAddMembers}
      />

      <NicknamePickerModal
        translateY={translateNicknamePickerY}
        members={members}
        nicknameMap={nicknameMap}
        onSelect={handlePickMemberForNickname}
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
  root: { flex: 1, backgroundColor: "#F3F4F6" },
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
  scroll: { paddingBottom: 8 },
  hero: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },
  heroAvatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  heroAvatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    maxWidth: 240,
  },
  memberCount: { fontSize: 13, color: "#6B7280" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: "#FFF",
    borderTopWidth: 0.5,
    borderTopColor: "#F3F4F6",
  },
  gap: { height: 10, backgroundColor: "#F3F4F6" },
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
  seeAllBtn: { paddingTop: 12 },
  seeAllText: { fontSize: 14, color: "#0F766E", fontWeight: "600" },
  emptyText: { fontSize: 13, color: "#9CA3AF", paddingVertical: 4 },
  menuDivider: { height: 0.5, backgroundColor: "#F3F4F6" },
});
