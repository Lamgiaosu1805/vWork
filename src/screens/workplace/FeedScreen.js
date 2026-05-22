import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
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

import { openDrawer } from '../../helpers/navigationRef';
import { canMgr } from '../../helpers/permissions';
import Header from '../../components/Header';
import feedApi from '../../api/feedApi';
import socket from '../../libs/socket';
import { store } from '../../redux/store';
import utils from '../../helpers/utils';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const BRAND = '#ED2E30';
const PAGE_SIZE = 10;

const REACTIONS = [
    { type: 'like',  emoji: '👍', label: 'Thích',     color: '#1877F2' },
    { type: 'love',  emoji: '❤️', label: 'Yêu thích', color: '#ED2E30' },
    { type: 'haha',  emoji: '😆', label: 'Haha',       color: '#F7B928' },
    { type: 'wow',   emoji: '😮', label: 'Wow',         color: '#F7B928' },
    { type: 'sad',   emoji: '😢', label: 'Buồn',        color: '#F7B928' },
    { type: 'angry', emoji: '😡', label: 'Phẫn nộ',   color: '#E9710F' },
];
const REACTION_MAP = Object.fromEntries(REACTIONS.map((r) => [r.type, r]));

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getTopReactions(reactions) {
    const counts = {};
    reactions.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
}

// ── AuthImage ────────────────────────────────────────────────────────────────
const AuthImage = ({ filename, style, resizeMode = 'cover' }) => {
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
    if (!uri) return <View style={[style, styles.imgPlaceholder]} />;
    return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
};

// ── AuthAvatar ────────────────────────────────────────────────────────────────
const AuthAvatar = ({ filename, name, size = 40 }) => {
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
        <View style={[styles.authorAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.authorAvatarText, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
        </View>
    );
};

// ── ImageGrid ─────────────────────────────────────────────────────────────────
const ImageGrid = ({ images, onImagePress }) => {
    if (!images?.length) return null;
    const count = Math.min(images.length, 4);
    const more = images.length - 4;
    if (count === 1) {
        return (
            <TouchableOpacity onPress={() => onImagePress(0)} activeOpacity={0.9}>
                <AuthImage filename={images[0]} style={styles.img1} />
            </TouchableOpacity>
        );
    }
    if (count === 2) {
        return (
            <View style={styles.imgRow}>
                {images.slice(0, 2).map((f, i) => (
                    <TouchableOpacity key={i} style={styles.img2Wrap} onPress={() => onImagePress(i)} activeOpacity={0.9}>
                        <AuthImage filename={f} style={styles.imgFill} />
                    </TouchableOpacity>
                ))}
            </View>
        );
    }
    if (count === 3) {
        return (
            <View style={styles.imgRow}>
                <TouchableOpacity style={styles.img3Left} onPress={() => onImagePress(0)} activeOpacity={0.9}>
                    <AuthImage filename={images[0]} style={styles.imgFill} />
                </TouchableOpacity>
                <View style={styles.img3Right}>
                    {images.slice(1, 3).map((f, i) => (
                        <TouchableOpacity key={i} style={styles.img3RightCell} onPress={() => onImagePress(i + 1)} activeOpacity={0.9}>
                            <AuthImage filename={f} style={styles.imgFill} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }
    return (
        <View style={styles.imgGrid2x2}>
            {images.slice(0, 4).map((f, i) => (
                <TouchableOpacity key={i} style={styles.img4Cell} onPress={() => onImagePress(i)} activeOpacity={0.9}>
                    <AuthImage filename={f} style={styles.imgFill} />
                    {i === 3 && more > 0 && (
                        <View style={styles.moreOverlay}>
                            <Text style={styles.moreText}>+{more}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

// ── ReactionButton — giữ lâu để chọn emoji (Facebook style) ─────────────────
const ReactionButton = ({ myReaction, onReact }) => {
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTop, setPickerTop] = useState(400);
    const pickerAnim = useRef(new Animated.Value(0)).current;
    const btnRef = useRef(null);
    const tapScale = useRef(new Animated.Value(1)).current;
    const currentR = myReaction ? REACTION_MAP[myReaction.type] : null;

    const openPicker = () => {
        btnRef.current?.measure((_x, _y, _w, _h, _pageX, pageY) => {
            setPickerTop(pageY - 72);
            setPickerVisible(true);
            Animated.spring(pickerAnim, {
                toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10,
            }).start();
        });
    };

    const closePicker = (cb) => {
        Animated.timing(pickerAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
            setPickerVisible(false);
            cb?.();
        });
    };

    const handlePress = () => {
        Animated.sequence([
            Animated.spring(tapScale, { toValue: 1.3, useNativeDriver: true, speed: 30 }),
            Animated.spring(tapScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
        ]).start();
        onReact(myReaction?.type ?? 'like');
    };

    const handlePick = (type) => closePicker(() => onReact(type));

    return (
        <>
            <Pressable
                ref={btnRef}
                collapsable={false}
                style={styles.actionBtn}
                onPress={handlePress}
                onLongPress={openPicker}
                delayLongPress={400}
            >
                <Animated.Text style={{ fontSize: 20, transform: [{ scale: tapScale }] }}>
                    {currentR?.emoji ?? '👍'}
                </Animated.Text>
                <Text style={[styles.actionLabel, currentR && { color: currentR.color }]}>
                    {currentR?.label ?? 'Thích'}
                </Text>
            </Pressable>

            <Modal
                visible={pickerVisible}
                transparent
                statusBarTranslucent
                animationType="none"
                onRequestClose={() => closePicker()}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={() => closePicker()}>
                    <Animated.View style={[
                        styles.pickerStrip,
                        { top: pickerTop },
                        {
                            opacity: pickerAnim,
                            transform: [{
                                scale: pickerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                            }],
                        },
                    ]}>
                        {REACTIONS.map((r) => (
                            <Pressable key={r.type} onPress={() => handlePick(r.type)} style={styles.pickerItemCircle}>
                                <Text style={styles.pickerEmojiLarge}>{r.emoji}</Text>
                                {myReaction?.type === r.type && (
                                    <View style={styles.pickerActiveDot} />
                                )}
                            </Pressable>
                        ))}
                    </Animated.View>
                </Pressable>
            </Modal>
        </>
    );
};

// ── ReactionsModal — danh sách ai thả cảm xúc gì ────────────────────────────
const ReactionsModal = ({ visible, onClose, reactions }) => {
    const [filter, setFilter] = useState('all');
    const types = [...new Set(reactions.map((r) => r.type))];
    const shown = filter === 'all' ? reactions : reactions.filter((r) => r.type === filter);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.rmOverlay}>
                <View style={styles.rmSheet}>
                    <View style={styles.rmHeader}>
                        <Text style={styles.rmTitle}>Cảm xúc</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={8}>
                            <Ionicons name="close" size={22} color="#65676B" />
                        </TouchableOpacity>
                    </View>

                    {/* Filter tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rmTabs} contentContainerStyle={{ gap: 6 }}>
                        <TouchableOpacity
                            onPress={() => setFilter('all')}
                            style={[styles.rmTab, filter === 'all' && styles.rmTabActive]}
                        >
                            <Text style={[styles.rmTabText, filter === 'all' && styles.rmTabTextActive]}>
                                Tất cả  {reactions.length}
                            </Text>
                        </TouchableOpacity>
                        {types.map((type) => {
                            const r = REACTION_MAP[type];
                            const count = reactions.filter((x) => x.type === type).length;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setFilter(type)}
                                    style={[styles.rmTab, filter === type && styles.rmTabActive]}
                                >
                                    <Text style={[styles.rmTabText, filter === type && styles.rmTabTextActive]}>
                                        {r.emoji}  {count}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.rmDivider} />

                    {/* List */}
                    <FlatList
                        data={shown}
                        keyExtractor={(_, i) => String(i)}
                        renderItem={({ item }) => (
                            <View style={styles.rmRow}>
                                <AuthAvatar
                                    filename={item.author_avatar}
                                    name={item.author_name ?? '?'}
                                    size={36}
                                />
                                <Text style={styles.rmName} numberOfLines={1}>
                                    {item.author_name ?? 'Người dùng'}
                                </Text>
                                <Text style={styles.rmEmoji}>{REACTION_MAP[item.type]?.emoji}</Text>
                            </View>
                        )}
                        style={{ maxHeight: 340 }}
                        ListEmptyComponent={
                            <Text style={styles.rmEmpty}>Chưa có cảm xúc nào</Text>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

// ── PostCard ──────────────────────────────────────────────────────────────────
const PostCard = ({ post, currentUser, onReact, onDelete, onPin, onCommentPress, canManage }) => {
    // API trả "id" = account._id; reactions lưu user_id = req.account._id
    const userId = String(currentUser?.id ?? currentUser?._id ?? '');
    const myReaction = (post.reactions ?? []).find((r) => String(r.user_id) === userId);
    const isAuthor = post.author_id === userId || post.author_id?.toString() === userId;
    const [expanded, setExpanded] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [reactionsOpen, setReactionsOpen] = useState(false);

    const totalReactions = post.reactions?.length ?? 0;
    const legacyLikes = !post.reactions ? post.likes : null;
    const topReactions = post.reactions?.length ? getTopReactions(post.reactions) : [];

    const showMenu = () => {
        const options = [];
        if (canManage) options.push(post.pinned ? 'Bỏ ghim' : 'Ghim bài');
        if (isAuthor || canManage) options.push('Xóa bài viết');
        if (!options.length) return;
        Alert.alert('', '', [
            ...options.map((opt) => ({
                text: opt,
                style: opt.includes('Xóa') ? 'destructive' : 'default',
                onPress: () => {
                    if (opt.includes('ghim') || opt.includes('Ghim')) onPin(post._id);
                    else {
                        Alert.alert('Xóa bài viết?', 'Bài viết sẽ bị xóa vĩnh viễn.', [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Xóa', style: 'destructive', onPress: () => onDelete(post._id) },
                        ]);
                    }
                },
            })),
            { text: 'Đóng', style: 'cancel' },
        ]);
    };

    return (
        <View style={styles.card}>
            {post.pinned && (
                <View style={styles.pinnedBar}>
                    <Ionicons name="pin" size={12} color="#F59E0B" />
                    <Text style={styles.pinnedText}>Bài ghim</Text>
                </View>
            )}

            <View style={styles.authorRow}>
                <AuthAvatar filename={post.author_avatar} name={post.author_name} size={40} />
                <View style={styles.authorMeta}>
                    <View style={styles.authorNameRow}>
                        <Text style={styles.authorName}>{post.author_name}</Text>
                        {post.type === 'announcement' && (
                            <View style={styles.announceBadge}>
                                <Text style={styles.announceText}>Thông báo</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.authorTime}>
                        {dayjs(post.createdAt).fromNow()}
                    </Text>
                </View>
                {(isAuthor || canManage) && (
                    <TouchableOpacity onPress={showMenu} hitSlop={12} style={styles.menuBtn}>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
                    </TouchableOpacity>
                )}
            </View>

            {!!post.content && (
                <View style={styles.contentWrap}>
                    <Text style={styles.content} numberOfLines={expanded ? undefined : 5}>
                        {post.content}
                    </Text>
                    {!expanded && post.content.length > 200 && (
                        <TouchableOpacity onPress={() => setExpanded(true)}>
                            <Text style={styles.seeMore}>Xem thêm</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <ImageGrid images={post.images} onImagePress={(idx) => setLightboxIdx(idx)} />

            {/* Stats row */}
            {(totalReactions > 0 || legacyLikes?.length > 0 || post.comments_count > 0) && (
                <View style={styles.statsRow}>
                    {totalReactions > 0 ? (
                        <TouchableOpacity style={styles.statsItem} onPress={() => setReactionsOpen(true)} activeOpacity={0.7}>
                            <View style={styles.reactionEmojis}>
                                {topReactions.map(([type]) => (
                                    <Text key={type} style={{ fontSize: 13 }}>{REACTION_MAP[type]?.emoji}</Text>
                                ))}
                            </View>
                            <Text style={styles.statsText}>{totalReactions}</Text>
                        </TouchableOpacity>
                    ) : legacyLikes?.length > 0 ? (
                        <View style={styles.statsItem}>
                            <View style={styles.likeIcon}>
                                <Ionicons name="heart" size={11} color="#fff" />
                            </View>
                            <Text style={styles.statsText}>{legacyLikes.length}</Text>
                        </View>
                    ) : null}
                    {post.comments_count > 0 && (
                        <Text style={[styles.statsText, { marginLeft: 'auto' }]}>
                            {post.comments_count} bình luận
                        </Text>
                    )}
                </View>
            )}

            <View style={styles.divider} />
            <View style={styles.actionsRow}>
                <ReactionButton myReaction={myReaction} onReact={(type) => onReact(post._id, type)} />
                <TouchableOpacity style={styles.actionBtn} onPress={() => onCommentPress(post)}>
                    <Ionicons name="chatbubble-outline" size={20} color="#65676B" />
                    <Text style={styles.actionLabel}>Bình luận</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={lightboxIdx !== null} transparent animationType="fade" onRequestClose={() => setLightboxIdx(null)}>
                <Pressable style={styles.lightboxBg} onPress={() => setLightboxIdx(null)}>
                    {lightboxIdx !== null && post.images?.[lightboxIdx] && (
                        <AuthImage filename={post.images[lightboxIdx]} style={styles.lightboxImg} resizeMode="contain" />
                    )}
                </Pressable>
            </Modal>

            <ReactionsModal
                visible={reactionsOpen}
                onClose={() => setReactionsOpen(false)}
                reactions={post.reactions ?? []}
            />
        </View>
    );
};

// ── FeedScreen ────────────────────────────────────────────────────────────────
export default function FeedScreen({ navigation }) {
    const user = useSelector((state) => state.auth.user);
    const canManage = canMgr(user, 'workplace');
    const listRef = useRef(null);

    const [posts, setPosts] = useState([]);
    const [pendingPosts, setPendingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchPosts = useCallback(async (pg = 1, replace = true) => {
        try {
            const res = await feedApi.getPosts({ page: pg, limit: PAGE_SIZE });
            const items = res?.data?.data ?? res?.data ?? [];
            const total = res?.data?.pagination?.total ?? items.length;
            if (replace) setPosts(items);
            else setPosts((prev) => [...prev, ...items]);
            setHasMore(pg * PAGE_SIZE < total);
            setPage(pg);
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Tải bảng tin thất bại' });
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchPosts(1, true).finally(() => setLoading(false));
    }, [fetchPosts]);

    useEffect(() => {
        socket.emit('join_feed');

        const handleNewPost = ({ post }) => {
            setPendingPosts((prev) => {
                if (prev.some((p) => p._id === post._id)) return prev;
                return [post, ...prev];
            });
        };
        const handleReactionUpdated = ({ post_id, reactions }) => {
            setPosts((prev) => prev.map((p) => p._id === post_id ? { ...p, reactions } : p));
        };
        const handleCommentCountUpdated = ({ post_id, comments_count }) => {
            setPosts((prev) => prev.map((p) => p._id === post_id ? { ...p, comments_count } : p));
        };
        const handlePostDeleted = ({ post_id }) => {
            setPosts((prev) => prev.filter((p) => p._id !== post_id));
            setPendingPosts((prev) => prev.filter((p) => p._id !== post_id));
        };
        const handlePostPinned = () => { fetchPosts(1, true); };

        socket.on('new_post', handleNewPost);
        socket.on('reaction_updated', handleReactionUpdated);
        socket.on('comment_count_updated', handleCommentCountUpdated);
        socket.on('post_deleted', handlePostDeleted);
        socket.on('post_pinned', handlePostPinned);

        return () => {
            socket.emit('leave_feed');
            socket.off('new_post', handleNewPost);
            socket.off('reaction_updated', handleReactionUpdated);
            socket.off('comment_count_updated', handleCommentCountUpdated);
            socket.off('post_deleted', handlePostDeleted);
            socket.off('post_pinned', handlePostPinned);
        };
    }, [fetchPosts]);

    const flushPending = () => {
        setPosts((prev) => {
            const toAdd = pendingPosts.filter((p) => !prev.some((x) => x._id === p._id));
            return [...toAdd, ...prev];
        });
        setPendingPosts([]);
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setPendingPosts([]);
        await fetchPosts(1, true);
        setRefreshing(false);
    };

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchPosts(page + 1, false);
        setLoadingMore(false);
    };

    const handleReact = async (postId, type) => {
        try {
            await feedApi.reactPost(postId, type);
            // socket reaction_updated tự cập nhật state
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

    const handlePin = async (postId) => {
        try {
            await feedApi.pinPost(postId);
            await fetchPosts(1, true);
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Thao tác thất bại' });
        }
    };

    // Compose bar — hiện ở đầu danh sách
    const ComposeBar = (
        <TouchableOpacity
            style={styles.composeTap}
            onPress={() => navigation.navigate('ComposePostScreen')}
            activeOpacity={0.85}
        >
            <AuthAvatar filename={user?.avatar} name={user?.full_name ?? user?.username ?? ''} size={36} />
            <View style={styles.composePlaceholder}>
                <Text style={styles.composePlaceholderText}>Bạn đang nghĩ gì?</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.safe}>
            <Header title="Bảng tin" leftIconName="menu" onLeftPress={openDrawer} />

            {/* Banner bài mới */}
            {pendingPosts.length > 0 && (
                <TouchableOpacity style={styles.newsBanner} onPress={flushPending} activeOpacity={0.85}>
                    <Ionicons name="arrow-up-circle" size={16} color="#fff" />
                    <Text style={styles.newsBannerText}>{pendingPosts.length} bài viết mới</Text>
                </TouchableOpacity>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BRAND} />
                </View>
            ) : (
                <FlatList
                    ref={listRef}
                    data={posts}
                    keyExtractor={(item) => item._id}
                    ListHeaderComponent={ComposeBar}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            currentUser={user}
                            onReact={handleReact}
                            onDelete={handleDelete}
                            onPin={handlePin}
                            onCommentPress={(p) => navigation.navigate('FeedCommentScreen', { post: p })}
                            canManage={canManage}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND} />}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={loadingMore ? <View style={styles.footerLoader}><ActivityIndicator size="small" color={BRAND} /></View> : null}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="newspaper-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
            )}
        </View>
    );
}

const IMG_HEIGHT = 240;
const IMG_GRID = 180;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F0F2F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingVertical: 8 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyText: { color: '#9CA3AF', fontSize: 14 },
    footerLoader: { paddingVertical: 20, alignItems: 'center' },

    newsBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, backgroundColor: BRAND, paddingVertical: 9,
    },
    newsBannerText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Compose bar
    composeTap: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12,
        marginBottom: 8,
    },
    composePlaceholder: {
        flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 9,
    },
    composePlaceholderText: { fontSize: 15, color: '#8A8D91' },

    // Card
    card: { backgroundColor: '#fff' },
    pinnedBar: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingTop: 10 },
    pinnedText: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },

    authorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
    authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    authorAvatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    authorMeta: { flex: 1 },
    authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    authorName: { fontSize: 15, fontWeight: '700', color: '#050505' },
    announceBadge: { backgroundColor: '#FEE2E2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    announceText: { fontSize: 11, color: BRAND, fontWeight: '700' },
    authorTime: { fontSize: 12, color: '#65676B', marginTop: 1 },
    menuBtn: { padding: 4 },

    contentWrap: { paddingHorizontal: 14, paddingBottom: 10 },
    content: { fontSize: 15, color: '#050505', lineHeight: 22 },
    seeMore: { fontSize: 14, color: '#65676B', marginTop: 2, fontWeight: '500' },

    imgPlaceholder: { backgroundColor: '#E4E6EB' },
    img1: { width: '100%', height: IMG_HEIGHT },
    imgRow: { flexDirection: 'row', gap: 2 },
    img2Wrap: { flex: 1, height: IMG_HEIGHT },
    imgFill: { width: '100%', height: '100%' },
    img3Left: { flex: 1, height: IMG_HEIGHT },
    img3Right: { flex: 1, gap: 2 },
    img3RightCell: { flex: 1 },
    imgGrid2x2: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
    img4Cell: { width: '49.5%', height: IMG_GRID, position: 'relative' },
    moreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
    moreText: { color: '#fff', fontSize: 26, fontWeight: '700' },

    lightboxBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
    lightboxImg: { width: '100%', height: '80%' },

    statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
    statsItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    reactionEmojis: { flexDirection: 'row', gap: 1 },
    likeIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: BRAND, justifyContent: 'center', alignItems: 'center' },
    statsText: { fontSize: 13, color: '#65676B' },

    divider: { height: 1, backgroundColor: '#E4E6EB', marginHorizontal: 14 },
    actionsRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 2 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
    actionLabel: { fontSize: 14, fontWeight: '600', color: '#65676B' },

    // ReactionsModal (bottom sheet)
    rmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    rmSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
    rmHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    rmTitle: { fontSize: 16, fontWeight: '700', color: '#050505' },
    rmTabs: { paddingHorizontal: 12, paddingVertical: 8 },
    rmTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E4E6EB', backgroundColor: 'transparent' },
    rmTabActive: { backgroundColor: BRAND, borderColor: BRAND },
    rmTabText: { fontSize: 13, color: '#65676B', fontWeight: '600' },
    rmTabTextActive: { color: '#fff' },
    rmDivider: { height: 1, backgroundColor: '#E4E6EB' },
    rmRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
    rmAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: BRAND, justifyContent: 'center', alignItems: 'center' },
    rmAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    rmName: { flex: 1, fontSize: 14, color: '#050505', fontWeight: '500' },
    rmEmoji: { fontSize: 22 },
    rmEmpty: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 24 },

    // Reaction picker — Facebook style horizontal pill
    pickerStrip: {
        position: 'absolute',
        left: 16, right: 16,
        backgroundColor: '#fff',
        borderRadius: 32,
        paddingHorizontal: 6, paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 10,
    },
    pickerItemCircle: { alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2 },
    pickerEmojiLarge: { fontSize: 38 },
    pickerActiveDot: {
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: BRAND, marginTop: 3,
    },
});
