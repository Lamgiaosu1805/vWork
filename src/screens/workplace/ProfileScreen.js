import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import RNBlobUtil from 'react-native-blob-util';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import api from '../../api/axiosInstance';
import { store } from '../../redux/store';
import utils from '../../helpers/utils';
import { canMgr } from '../../helpers/permissions';
import Header from '../../components/Header';
import PostCard, { AuthAvatar, AuthImage, BRAND } from '../../components/PostCard';
import feedApi from '../../api/feedApi';

dayjs.locale('vi');

const COVER_HEIGHT = 200;
const AVATAR_SIZE = 96;
const EMPLOYMENT_LABEL = { fulltime: 'Toàn thời gian', parttime: 'Bán thời gian' };

// ── ProfileScreen ─────────────────────────────────────────────────────────────
export default function ProfileScreen({ route, navigation }) {
    const { accountId } = route.params ?? {};
    const currentUser = useSelector((s) => s.auth.user);
    const accessToken = useSelector((s) => s.auth.accessToken);
    const canManagePost = canMgr(currentUser, 'workplace');

    const isSelf = !accountId || accountId === currentUser?.id || accountId === currentUser?.user_id;
    const resolvedId = isSelf ? 'me' : accountId;

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.get(`/user/profile/${resolvedId}`, { requiresAuth: true });
            setProfile(res.data ?? res);
        } catch {
            Toast.show({ type: 'error', text1: 'Không thể tải trang cá nhân' });
        } finally {
            setLoading(false);
        }
    }, [resolvedId]);

    const fetchPosts = useCallback(async (pageNum = 1, replace = false) => {
        const targetId = isSelf
            ? (currentUser?.id ?? currentUser?._id ?? currentUser?.user_id)
            : accountId;
        if (!targetId) return;
        try {
            const res = await feedApi.getPosts({ author_id: targetId, page: pageNum, limit: 10 });
            const data = res?.data?.data ?? res?.data ?? [];
            const pagination = res?.data?.pagination ?? res?.pagination ?? {};
            if (replace) setPosts(data);
            else setPosts((prev) => [...prev, ...data]);
            setHasMore(pageNum < (pagination.total_pages ?? 1));
        } catch {
            Toast.show({ type: 'error', text1: 'Không thể tải bài đăng' });
        }
    }, [isSelf, accountId, currentUser]);

    useEffect(() => {
        fetchProfile();
        fetchPosts(1, true);
    }, [fetchProfile, fetchPosts]);

    const handleLoadMore = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const next = page + 1;
        setPage(next);
        await fetchPosts(next, false);
        setLoadingMore(false);
    };

    const handleReact = async (postId, type) => {
        try {
            const res = await feedApi.reactPost(postId, type);
            const reactions = res?.data?.reactions ?? res?.reactions;
            if (reactions) {
                setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, reactions } : p));
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Thao tác thất bại' });
        }
    };

    const handleDelete = async (postId) => {
        try {
            await feedApi.deletePost(postId);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
            Toast.show({ type: 'success', text1: 'Đã xóa bài viết' });
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Xóa thất bại' });
        }
    };

    const pickAndUploadAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });
        if (result.canceled) return;
        setUploadingAvatar(true);
        try {
            const manipulated = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [{ resize: { width: 400, height: 400 } }],
                { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
            );
            const response = await RNBlobUtil.fetch(
                'POST',
                `${utils.BASE_URL}/user/uploadAvatar`,
                { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' },
                [{ name: 'avatar', filename: 'avatar.jpg', type: 'image/jpeg', data: RNBlobUtil.wrap(manipulated.uri.replace('file://', '')) }]
            );
            const json = JSON.parse(response.data);
            if (json.avatar) {
                setProfile((p) => p ? { ...p, avatar: json.avatar } : p);
                Toast.show({ type: 'success', text1: 'Cập nhật ảnh đại diện thành công' });
            }
        } catch {
            Toast.show({ type: 'error', text1: 'Cập nhật ảnh đại diện thất bại' });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const pickAndUploadCover = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.85,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        setUploadingCover(true);
        try {
            const response = await RNBlobUtil.fetch(
                'POST',
                `${utils.BASE_URL}/user/uploadCoverPhoto`,
                { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' },
                [{ name: 'cover_photo', filename: asset.fileName ?? 'cover.jpg', type: asset.mimeType ?? 'image/jpeg', data: RNBlobUtil.wrap(asset.uri.replace('file://', '')) }]
            );
            const json = JSON.parse(response.data);
            if (json.cover_photo) {
                setProfile((p) => p ? { ...p, cover_photo: json.cover_photo } : p);
                Toast.show({ type: 'success', text1: 'Cập nhật ảnh bìa thành công' });
            }
        } catch {
            Toast.show({ type: 'error', text1: 'Cập nhật ảnh bìa thất bại' });
        } finally {
            setUploadingCover(false);
        }
    };

    const primaryDept = profile?.departments?.[0];

    const ListHeader = () => (
        <View>
            {/* Cover photo */}
            <View style={styles.coverWrap}>
                <AuthImage filename={profile?.cover_photo} style={styles.cover} />
                {isSelf && (
                    <TouchableOpacity style={styles.editCoverBtn} onPress={pickAndUploadCover} disabled={uploadingCover}>
                        {uploadingCover
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="camera" size={16} color="#fff" />
                        }
                        <Text style={styles.editCoverText}>Đổi ảnh bìa</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Avatar + name section */}
            <View style={styles.infoSection}>
                <View style={styles.avatarRow}>
                    <View style={styles.avatarWrap}>
                        <AuthAvatar
                            filename={isSelf ? currentUser?.avatar : profile?.avatar}
                            name={profile?.full_name}
                            size={AVATAR_SIZE}
                        />
                        {isSelf && (
                            <TouchableOpacity style={styles.editAvatarBtn} onPress={pickAndUploadAvatar} disabled={uploadingAvatar}>
                                {uploadingAvatar
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Ionicons name="camera" size={14} color="#fff" />
                                }
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <Text style={styles.fullName}>{profile?.full_name}</Text>
                {primaryDept && (
                    <Text style={styles.deptText}>
                        {primaryDept.position_name ? `${primaryDept.position_name} · ` : ''}{primaryDept.department_name}
                    </Text>
                )}
                <Text style={styles.maNv}>{profile?.ma_nv}</Text>
            </View>

            {/* About card */}
            <View style={styles.aboutCard}>
                <Text style={styles.sectionTitle}>Giới thiệu</Text>
                {profile?.departments?.map((d, i) => (
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
                    <Text style={styles.infoText}>{EMPLOYMENT_LABEL[profile?.employment_type] ?? profile?.employment_type}</Text>
                </View>
                {isSelf && profile?.phone_number && (
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={16} color="#65676B" />
                        <Text style={styles.infoText}>{profile.phone_number}</Text>
                    </View>
                )}
                {profile?.date_of_birth && (
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#65676B" />
                        <Text style={styles.infoText}>{dayjs(profile.date_of_birth).format('DD/MM/YYYY')}</Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#65676B" />
                    <Text style={styles.infoText}>Gia nhập {dayjs(profile?.createdAt).format('MM/YYYY')}</Text>
                </View>
            </View>

            {/* Posts section header */}
            <View style={styles.postsHeader}>
                <Text style={styles.sectionTitle}>Bài đăng</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={['bottom']}>
                <Header title="Trang cá nhân" leftIconName="chevron-back" onLeftPress={() => navigation.goBack()} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BRAND} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <Header title="Trang cá nhân" leftIconName="chevron-back" onLeftPress={() => navigation.goBack()} />
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
                        onCommentPress={(p) => navigation.navigate('FeedCommentScreen', { post: p })}
                        onAuthorPress={(id) => navigation.navigate('WorkplaceProfileScreen', { accountId: id })}
                        canManage={canManagePost}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyPosts}>
                        <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
                    </View>
                }
                ListFooterComponent={
                    loadingMore ? <ActivityIndicator color={BRAND} style={{ marginVertical: 16 }} /> : null
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F0F2F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Cover
    coverWrap: { height: COVER_HEIGHT, position: 'relative', backgroundColor: '#E4E6EB' },
    cover: { width: '100%', height: '100%' },
    editCoverBtn: {
        position: 'absolute', bottom: 10, right: 12,
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(0,0,0,0.52)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    editCoverText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Avatar / info
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

    // About
    aboutCard: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingVertical: 14 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#050505', marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    infoText: { fontSize: 14, color: '#050505', flex: 1 },

    // Posts
    postsHeader: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },

    emptyPosts: { backgroundColor: '#fff', marginTop: 8, padding: 24, alignItems: 'center' },
    emptyText: { fontSize: 14, color: '#9CA3AF' },
});
