import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

import feedApi from '../../api/feedApi';
import socket from '../../libs/socket';
import { canMgr } from '../../helpers/permissions';
import Header from '../../components/Header';
import PostCard, { AuthAvatar, BRAND } from '../../components/PostCard';

dayjs.extend(relativeTime);
dayjs.locale('vi');

// ── CommentItem — Facebook style ──────────────────────────────────────────────
const CommentItem = ({ comment, canDelete, onDelete }) => {
    const [timeVisible, setTimeVisible] = useState(false);

    return (
        <View style={styles.commentItem}>
            <AuthAvatar filename={comment.author_avatar} name={comment.author_name} size={32} />
            <View style={styles.commentBody}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setTimeVisible((v) => !v)}
                    onLongPress={() => {
                        if (!canDelete) return;
                        Alert.alert('Xóa bình luận?', '', [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Xóa', style: 'destructive', onPress: () => onDelete(comment._id) },
                        ]);
                    }}
                >
                    <View style={styles.commentBubble}>
                        <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                        <Text style={styles.commentContent}>{comment.content}</Text>
                    </View>
                </TouchableOpacity>
                {timeVisible && (
                    <Text style={styles.commentTime}>{dayjs(comment.createdAt).fromNow()}</Text>
                )}
            </View>
        </View>
    );
};

// ── CommentScreen ─────────────────────────────────────────────────────────────
export default function CommentScreen({ route, navigation }) {
    const { post: initialPost } = route.params;
    const user = useSelector((state) => state.auth.user);
    const isAdmin = user?.role === 'admin';
    const userId = user?.user_id ?? '';
    const canManagePost = canMgr(user, 'workplace');

    const [postState, setPostState] = useState(initialPost);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    const fetchComments = useCallback(async () => {
        try {
            const res = await feedApi.getComments(initialPost._id);
            const items = res?.data?.data ?? res?.data ?? [];
            setComments(items);
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Tải bình luận thất bại' });
        }
    }, [initialPost._id]);

    useEffect(() => {
        fetchComments().finally(() => setLoading(false));
    }, [fetchComments]);

    useEffect(() => {
        socket.emit('join_post', initialPost._id);

        const handleNewComment = ({ comment }) => {
            setComments((prev) => {
                const exists = prev.some((c) => c._id === comment._id);
                return exists ? prev : [...prev, comment];
            });
        };
        const handleCommentDeleted = ({ comment_id }) => {
            setComments((prev) => prev.filter((c) => c._id !== comment_id));
        };
        const handleReactionUpdated = ({ post_id, reactions }) => {
            if (post_id === initialPost._id) {
                setPostState((p) => ({ ...p, reactions }));
            }
        };

        socket.on('new_comment', handleNewComment);
        socket.on('comment_deleted', handleCommentDeleted);
        socket.on('reaction_updated', handleReactionUpdated);

        return () => {
            socket.emit('leave_post', initialPost._id);
            socket.off('new_comment', handleNewComment);
            socket.off('comment_deleted', handleCommentDeleted);
            socket.off('reaction_updated', handleReactionUpdated);
        };
    }, [initialPost._id]);

    useEffect(() => {
        if (comments.length > 0) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
        }
    }, [comments.length]);

    const handleReact = async (postId, type) => {
        try {
            await feedApi.reactPost(postId, type);
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Thao tác thất bại' });
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await feedApi.deletePost(postId);
            navigation.goBack();
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Xóa thất bại' });
        }
    };

    const handleSend = async () => {
        const value = text.trim();
        if (!value || sending) return;
        setSending(true);
        setText('');
        try {
            const res = await feedApi.createComment(initialPost._id, value);
            const newComment = res?.data ?? res;
            if (newComment?._id) {
                setComments((prev) => {
                    const exists = prev.some((c) => c._id === newComment._id);
                    return exists ? prev : [...prev, newComment];
                });
            }
        } catch (err) {
            setText(value);
            Toast.show({ type: 'error', text1: err?.message ?? 'Gửi thất bại' });
        } finally {
            setSending(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await feedApi.deleteComment(initialPost._id, commentId);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Xóa thất bại' });
        }
    };

    const CommentsHeader = (
        <View>
            <PostCard
                post={postState}
                currentUser={user}
                onReact={handleReact}
                onDelete={handleDeletePost}
                onCommentPress={() => inputRef.current?.focus()}
                canManage={canManagePost}
                onAuthorPress={(id) => navigation.navigate('WorkplaceProfileScreen', { accountId: id })}
            />
            <View style={styles.commentsLabel}>
                <Text style={styles.commentsLabelText}>
                    Bình luận{comments.length > 0 ? ` (${comments.length})` : ''}
                </Text>
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const isMine = item.author_id === userId || item.author_id?.toString() === userId;
        const canDelete = isMine || isAdmin;
        return (
            <CommentItem
                comment={item}
                canDelete={canDelete}
                onDelete={handleDeleteComment}
            />
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <Header title="Bài viết" leftIconName="chevron-back" onLeftPress={() => navigation.goBack()} />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={BRAND} />
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={comments}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListHeaderComponent={CommentsHeader}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>Chưa có bình luận nào.</Text>
                                <Text style={styles.emptyText}>Hãy là người đầu tiên!</Text>
                            </View>
                        }
                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    />
                )}

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <AuthAvatar filename={user?.avatar} name={user?.full_name ?? user?.username ?? ''} size={32} />
                    <View style={styles.inputWrap}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Viết bình luận..."
                            placeholderTextColor="#BCC0C4"
                            value={text}
                            onChangeText={setText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!text.trim() || sending}
                            style={styles.sendIcon}
                        >
                            {sending
                                ? <ActivityIndicator size="small" color={BRAND} />
                                : <Ionicons name="send" size={20} color={text.trim() ? BRAND : '#BCC0C4'} />
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F0F2F5' },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    list: { paddingBottom: 8 },

    commentsLabel: {
        backgroundColor: '#fff',
        paddingHorizontal: 14, paddingVertical: 10,
        marginTop: 8,
        borderBottomWidth: 1, borderBottomColor: '#E4E6EB',
    },
    commentsLabelText: { fontSize: 15, fontWeight: '700', color: '#050505' },

    // CommentItem — Facebook style
    commentItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 12,
        paddingTop: 8,
        backgroundColor: '#fff',
    },
    commentBody: { flex: 1 },
    commentBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F2F5',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: '95%',
    },
    commentAuthor: { fontSize: 13, fontWeight: '700', color: '#050505', marginBottom: 2 },
    commentContent: { fontSize: 14, color: '#050505', lineHeight: 20 },
    commentTime: { fontSize: 11, color: '#65676B', marginTop: 4, marginLeft: 12 },

    empty: { backgroundColor: '#fff', paddingTop: 40, alignItems: 'center', gap: 4 },
    emptyText: { color: '#9CA3AF', fontSize: 14 },

    // Input bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: '#E4E6EB',
        backgroundColor: '#fff',
        gap: 8,
    },
    inputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F0F2F5',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 6,
        gap: 8,
    },
    input: {
        flex: 1,
        minHeight: 28,
        maxHeight: 100,
        fontSize: 15,
        color: '#050505',
        paddingTop: 0,
        paddingBottom: 0,
    },
    sendIcon: { paddingBottom: 2 },
});
