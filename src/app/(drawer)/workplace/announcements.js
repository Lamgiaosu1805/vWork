import React, { useEffect } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { router } from "expo-router";
import useAnnouncementPosts from "../../../features/workplace/hooks/useAnnouncementPosts";
import { AuthAvatar, BRAND } from "../../../components/PostCard";
import { Skeleton, SkeletonCircle } from "../../../components/Skeleton";

dayjs.extend(relativeTime);
dayjs.locale('vi');

const AnnouncementItem = ({ post, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={() => onPress(post)} activeOpacity={0.85}>
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

export default function AnnouncementsScreen() {
    const {
        data: posts = [],
        isLoading: loading,
        isFetching,
        refetch,
        error,
    } = useAnnouncementPosts();
    const refreshing = isFetching && !loading;

    useEffect(() => {
        if (error) Toast.show({ type: 'error', text1: error?.message ?? 'Tải thất bại' });
    }, [error]);

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
                    <Ionicons name="chevron-back" size={26} color="#050505" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <View style={{ width: 34 }} />
            </View>

            {loading ? (
                <View style={styles.list}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <View key={i} style={[styles.card, { marginBottom: 8 }]}>
                            <Skeleton width={80} height={12} style={{ marginBottom: 10 }} />
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <SkeletonCircle size={36} />
                                <View style={{ flex: 1, gap: 6 }}>
                                    <Skeleton width="35%" height={13} />
                                    <Skeleton width="25%" height={11} />
                                </View>
                            </View>
                            <Skeleton width="90%" height={12} style={{ marginBottom: 6 }} />
                            <Skeleton width="60%" height={12} />
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <AnnouncementItem
                            post={item}
                            onPress={(p) => router.push({ pathname: '/workplace/comment', params: { post: JSON.stringify(p) } })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={BRAND} />
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

    authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    authorMeta: { flex: 1, marginLeft: 10 },
    authorName: { fontSize: 15, fontWeight: '700', color: '#050505' },
    authorTime: { fontSize: 12, color: '#65676B', marginTop: 1 },

    content: { fontSize: 15, color: '#050505', lineHeight: 22 },
    commentCount: { fontSize: 13, color: '#65676B', marginTop: 8 },
});
