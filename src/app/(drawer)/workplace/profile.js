import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import ImageView from "react-native-image-viewing";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { updateUserFields } from "../../../redux/slice/authSlice";
import { canMgr } from "../../../helpers/permissions";
import Header from "../../../components/Header";
import PostCard, { AuthAvatar, AuthImage, BRAND } from "../../../components/PostCard";
import useUserProfile from "../../../features/workplace/hooks/useUserProfile";
import useFeedPostsInfinite from "../../../features/workplace/hooks/useFeedPostsInfinite";
import useReactPost from "../../../features/workplace/hooks/useReactPost";
import useDeletePost from "../../../features/workplace/hooks/useDeletePost";
import useCreatePrivateConversation from "../../../features/workplace/hooks/useCreatePrivateConversation";
import useUploadAvatar from "../../../features/workplace/hooks/useUploadAvatar";
import useUploadCoverPhoto from "../../../features/workplace/hooks/useUploadCoverPhoto";
import { resolveConversationId } from "../../../utils/chatUtils";
import { ChevronLeft } from 'lucide-react-native';
import { Skeleton, SkeletonCircle } from "../../../components/Skeleton";

dayjs.locale('vi');

const COVER_HEIGHT = 200;
const AVATAR_SIZE = 96;
const EMPLOYMENT_LABEL = { fulltime: 'Toàn thời gian', parttime: 'Bán thời gian' };

export default function ProfileScreen() {
    const { accountId } = useLocalSearchParams();
    const dispatch = useDispatch();
    const currentUser = useSelector((s) => s.auth.user);
    const canManagePost = canMgr(currentUser, 'workplace');

    const isSelf = !accountId || accountId === currentUser?.id || accountId === currentUser?.user_id;
    const resolvedId = isSelf ? 'me' : accountId;
    const authorId = isSelf
        ? (currentUser?.id ?? currentUser?._id ?? currentUser?.user_id)
        : accountId;
    const postsQueryParams = { author_id: authorId };

    const queryClient = useQueryClient();
    const { data: profileData, isLoading: loading } = useUserProfile(resolvedId);
    const {
        data: postsData,
        isFetchingNextPage: loadingMore,
        hasNextPage,
        fetchNextPage,
    } = useFeedPostsInfinite(postsQueryParams, { enabled: !!authorId });
    const posts = postsData?.pages.flatMap((p) => p.items) ?? [];

    const reactPost = useReactPost();
    const deletePost = useDeletePost();
    const createPrivateConversation = useCreatePrivateConversation();
    const uploadAvatar = useUploadAvatar();
    const uploadCoverPhoto = useUploadCoverPhoto();

    const [previewImage, setPreviewImage] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [profileOverride, setProfileOverride] = useState(null);
    const displayProfile = profileOverride ?? profileData;

    const openImagePreview = (filename) => {
      if (!filename) return;

      setPreviewImage(filename);
      setPreviewVisible(true);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !loadingMore) fetchNextPage();
    };

    const patchPostInProfileCache = (postId, updater) => {
        queryClient.setQueryData(["posts", postsQueryParams], (old) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    items: page.items.map((p) => (p._id === postId ? updater(p) : p)),
                })),
            };
        });
    };

    const handleReact = (postId, type) => {
        reactPost.mutate(
            { postId, type },
            {
                onSuccess: (res) => {
                    const reactions = res?.data?.reactions ?? res?.reactions;
                    if (reactions) patchPostInProfileCache(postId, (p) => ({ ...p, reactions }));
                },
                onError: (err) => Toast.show({ type: 'error', text1: err?.message ?? 'Thao tác thất bại' }),
            },
        );
    };

    const handleDelete = (postId) => {
        deletePost.mutate(postId, {
            onSuccess: () => {
                queryClient.setQueryData(["posts", postsQueryParams], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            items: page.items.filter((p) => p._id !== postId),
                        })),
                    };
                });
                Toast.show({ type: 'success', text1: 'Đã xóa bài viết' });
            },
            onError: (err) => Toast.show({ type: 'error', text1: err?.message ?? 'Xóa thất bại' }),
        });
    };

    const pickAndUploadAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });
        if (result.canceled) return;

        const manipulated = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 400, height: 400 } }],
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
        );

        uploadAvatar.mutate(manipulated.uri, {
            onSuccess: (json) => {
                if (!json.avatar) return;
                setProfileOverride((p) => p ? { ...p, avatar: json.avatar } : p);
                dispatch(updateUserFields({ avatar: json.avatar, avatarUpdatedAt: Date.now() }));
                Toast.show({ type: 'success', text1: 'Cập nhật ảnh đại diện thành công' });
            },
            onError: () => Toast.show({ type: 'error', text1: 'Cập nhật ảnh đại diện thất bại' }),
        });
    };

    const pickAndUploadCover = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.85,
        });
        if (result.canceled) return;

        uploadCoverPhoto.mutate(result.assets[0], {
            onSuccess: (json) => {
                if (!json.cover_photo) return;
                setProfileOverride((p) => p ? { ...p, cover_photo: json.cover_photo } : p);
                Toast.show({ type: 'success', text1: 'Cập nhật ảnh bìa thành công' });
            },
            onError: () => Toast.show({ type: 'error', text1: 'Cập nhật ảnh bìa thất bại' }),
        });
    };

        const handleChatPress = () => {
            if (!accountId && !displayProfile) return;
            const receiver = accountId || displayProfile?.id_account?._id || displayProfile?._id;
            if (!receiver) {
                Toast.show({ type: 'error', text1: 'Không tìm thấy người nhận' });
                return;
            }

            createPrivateConversation.mutate(receiver, {
                onSuccess: (res) => {
                    const conversation = res?.data?.data ?? res?.data ?? res;
                    const conversationId = resolveConversationId(conversation);

                    if (!conversationId) {
                        Toast.show({ type: 'error', text1: 'Không thể mở cuộc trò chuyện' });
                        return;
                    }

                    router.push({ pathname: '/workplace/chat-room', params: { conversationId, conversation: JSON.stringify(conversation) } });
                },
                onError: (err) => Toast.show({ type: 'error', text1: err?.response?.data?.message ?? err?.message ?? 'Không thể tạo cuộc trò chuyện' }),
            });
        };

    const primaryDept = displayProfile?.departments?.[0];
    const insets = useSafeAreaInsets();

    const ListHeader = () => (
      <View>
        <View style={styles.coverWrap}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => openImagePreview(displayProfile?.cover_photo)}
          >
            <AuthImage filename={displayProfile?.cover_photo} style={styles.cover} />
          </TouchableOpacity>
          {isSelf && (
            <TouchableOpacity
              style={styles.editCoverBtn}
              onPress={pickAndUploadCover}
              disabled={uploadCoverPhoto.isPending}
            >
              {uploadCoverPhoto.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
              <Text style={styles.editCoverText}>Đổi ảnh bìa</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  openImagePreview(
                    isSelf
                      ? (displayProfile?.avatar ?? currentUser?.avatar)
                      : displayProfile?.avatar,
                  )
                }
              >
                <AuthAvatar
                  filename={
                    isSelf
                      ? (displayProfile?.avatar ?? currentUser?.avatar)
                      : displayProfile?.avatar
                  }
                  name={displayProfile?.full_name}
                  size={AVATAR_SIZE}
                  cacheKey={isSelf ? currentUser?.avatarUpdatedAt : undefined}
                />
              </TouchableOpacity>
              {isSelf && (
                <TouchableOpacity
                  style={styles.editAvatarBtn}
                  onPress={pickAndUploadAvatar}
                  disabled={uploadAvatar.isPending}
                >
                  {uploadAvatar.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.fullName}>{displayProfile?.full_name}</Text>
          {primaryDept && (
            <Text style={styles.deptText}>
              {primaryDept.position_name
                ? `${primaryDept.position_name} · `
                : ""}
              {primaryDept.department_name}
            </Text>
          )}
          <Text style={styles.maNv}>{displayProfile?.ma_nv}</Text>
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          {displayProfile?.departments?.map((d, i) => (
            <View key={i} style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color="#65676B" />
              <Text style={styles.infoText}>{d.department_name}</Text>
            </View>
          ))}
          {primaryDept?.position_name && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color="#65676B" />
              <Text style={styles.infoText}>{primaryDept.position_name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#65676B" />
            <Text style={styles.infoText}>
              {EMPLOYMENT_LABEL[displayProfile?.employment_type] ??
                displayProfile?.employment_type}
            </Text>
          </View>
          {isSelf && displayProfile?.phone_number && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#65676B" />
              <Text style={styles.infoText}>{displayProfile.phone_number}</Text>
            </View>
          )}
          {displayProfile?.date_of_birth && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#65676B" />
              <Text style={styles.infoText}>
                {dayjs(displayProfile.date_of_birth).format("DD/MM/YYYY")}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#65676B" />
            <Text style={styles.infoText}>
              Gia nhập {dayjs(displayProfile?.createdAt).format("MM/YYYY")}
            </Text>
          </View>
        </View>

        <View style={styles.postsHeader}>
          <Text style={styles.sectionTitle}>Bài đăng</Text>
        </View>
      </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={['bottom']}>
                <Header title="Trang cá nhân" LeftIcon={ChevronLeft} onLeftPress={() => router.back()} />
                <Skeleton width="100%" height={COVER_HEIGHT} borderRadius={0} />
                <View style={{ paddingHorizontal: 16, marginTop: -40 }}>
                    <SkeletonCircle size={84} style={{ borderWidth: 3, borderColor: '#fff' }} />
                    <Skeleton width="45%" height={18} style={{ marginTop: 12, marginBottom: 8 }} />
                    <Skeleton width="30%" height={13} style={{ marginBottom: 4 }} />
                    <Skeleton width="20%" height={12} />
                </View>
                <View style={styles.aboutCard}>
                    <Skeleton width={80} height={13} style={{ marginBottom: 12 }} />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <View key={i} style={styles.infoRow}>
                            <Skeleton width={16} height={16} borderRadius={4} />
                            <Skeleton width="55%" height={13} />
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <Header
          title="Trang cá nhân"
          LeftIcon={ChevronLeft}
          onLeftPress={() => router.back()}
        />
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={<ListHeader />}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUser={currentUser}
              onReact={handleReact}
              onDelete={handleDelete}
              onCommentPress={(p) =>
                router.push({ pathname: "/workplace/comment", params: { post: JSON.stringify(p) } })
              }
              onAuthorPress={(id) =>
                router.push({ pathname: "/workplace/profile", params: { accountId: id } })
              }
              canManage={canManagePost}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={BRAND} style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />

        <ImageView
          images={[{ uri: previewImage }]}
          imageIndex={0}
          visible={previewVisible}
          onRequestClose={() => setPreviewVisible(false)}
        />

        {!isSelf && (
          <TouchableOpacity
            style={[
              styles.messageButton,
              { bottom: Math.max(16, insets.bottom + 12) },
            ]}
            activeOpacity={0.85}
            onPress={handleChatPress}
            disabled={createPrivateConversation.isPending}
          >
            {createPrivateConversation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F0F2F5' },

    coverWrap: { height: COVER_HEIGHT, position: 'relative', backgroundColor: '#E4E6EB' },
    cover: { width: '100%', height: '100%' },
    editCoverBtn: {
        position: 'absolute', bottom: 10, right: 12,
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(0,0,0,0.52)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    editCoverText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    infoSection: { backgroundColor: '#fff', alignItems: 'center', paddingBottom: 20, paddingTop: 0 },
    avatarRow: { marginTop: -(AVATAR_SIZE / 2), marginBottom: 10 },
    avatarWrap: { position: 'relative' },
    editAvatarBtn: {
        position: 'absolute', bottom: 2, right: 2,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
    },

    fullName: { fontSize: 22, fontWeight: '800', color: '#050505', textAlign: 'center', marginBottom: 4 },
    deptText: { fontSize: 14, color: '#65676B', textAlign: 'center', marginBottom: 2 },
    maNv: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },

    aboutCard: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingVertical: 14 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#050505', marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    infoText: { fontSize: 14, color: '#050505', flex: 1 },

    postsHeader: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },

    emptyPosts: { backgroundColor: '#fff', marginTop: 8, padding: 24, alignItems: 'center' },
    emptyText: { fontSize: 14, color: '#9CA3AF' },

    messageButton: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
});
