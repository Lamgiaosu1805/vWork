import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import RNBlobUtil from 'react-native-blob-util';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import feedApi from '../../api/feedApi';
import { store } from '../../redux/store';
import utils from '../../helpers/utils';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const BRAND = '#ED2E30';

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AuthAvatar = ({ filename, name, size = 36 }) => {
    const [uri, setUri] = useState(null);
    useEffect(() => {
        if (!filename) return;
        let cancelled = false;
        const { accessToken } = store.getState().auth;
        const url = `${utils.BASE_URL}/document/getFile?filename=${encodeURIComponent(filename)}`;
        RNBlobUtil.fetch('GET', url, { Authorization: `Bearer ${accessToken}` })
            .then((res) => { if (!cancelled) setUri(`data:image/jpeg;base64,${res.base64()}`); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [filename]);
    if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
        </View>
    );
};

const AnnouncementItem = ({ post, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={() => onPress(post)} activeOpacity={0.85}>
        {/* Pin indicator */}
        <View style={styles.announceBadgeRow}>
            <Ionicons name="megaphone-outline" size={13} color={BRAND} />
            <Text style={styles.announceBadgeText}>Thông báo</Text>
        </View>

        <View style={styles.authorRow}>
            <AuthAvatar filename={post.author_avatar} name={post.author_name} size={36} />
            <View style={styles.authorMeta}>
                <Text style={styles.authorName}>{post.author_name}</Text>
                <Text style={styles.authorTime}>
                    {post.author_dept ? `${post.author_dept} · ` : ''}{dayjs(post.createdAt).fromNow()}
                </Text>
            </View>
        </View>

        {!!post.content && (
            <Text style={styles.content} numberOfLines={4}>{post.content}</Text>
        )}

        {post.comments_count > 0 && (
            <Text style={styles.commentCount}>{post.comments_count} bình luận</Text>
        )}
    </TouchableOpacity>
);

export default function AnnouncementsScreen({ navigation }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPosts = useCallback(async () => {
        try {
            const res = await feedApi.getPosts({ type: 'announcement', limit: 50 });
            setPosts(res?.data?.data ?? res?.data ?? []);
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Tải thất bại' });
        }
    }, []);

    useEffect(() => {
        fetchPosts().finally(() => setLoading(false));
    }, [fetchPosts]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPosts();
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={8}>
                    <Ionicons name="chevron-back" size={26} color="#050505" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <View style={{ width: 34 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BRAND} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <AnnouncementItem
                            post={item}
                            onPress={(p) => navigation.navigate('FeedCommentScreen', { post: p })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND} />
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F0F2F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 8 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyText: { color: '#9CA3AF', fontSize: 14 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 8, paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#E4E6EB',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#050505' },
    headerBtn: { padding: 4 },

    card: {
        backgroundColor: '#fff', borderRadius: 0,
        paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14,
    },
    announceBadgeRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8,
    },
    announceBadgeText: { fontSize: 12, color: BRAND, fontWeight: '600' },

    avatar: { backgroundColor: BRAND, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '700' },

    authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    authorMeta: { flex: 1, marginLeft: 10 },
    authorName: { fontSize: 15, fontWeight: '700', color: '#050505' },
    authorTime: { fontSize: 12, color: '#65676B', marginTop: 1 },

    content: { fontSize: 15, color: '#050505', lineHeight: 22 },
    commentCount: { fontSize: 13, color: '#65676B', marginTop: 8 },
});
