import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
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
import RNBlobUtil from 'react-native-blob-util';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

import feedApi from '../../api/feedApi';
import socket from '../../libs/socket';
import { store } from '../../redux/store';
import utils from '../../helpers/utils';
import Header from '../../components/Header';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const BRAND = '#ED2E30';

// ── AuthImage — ảnh bài viết có Bearer token ──────────────────────────────────
const AuthImage = ({ filename, style }) => {
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

    if (!uri) return <View style={[style, { backgroundColor: '#E4E6EB' }]} />;
    return <Image source={{ uri }} style={style} resizeMode="cover" />;
};

// ── PostHeader — nội dung bài viết hiện trên đầu màn comment ─────────────────
const PostHeader = ({ post }) => {
    const images = post.images ?? [];
    return (
        <View>
            <View style={phStyles.container}>
                <View style={phStyles.authorRow}>
                    <AuthAvatar filename={post.author_avatar} name={post.author_name} size={38} />
                    <View style={phStyles.authorMeta}>
                        <Text style={phStyles.authorName}>{post.author_name}</Text>
                        <Text style={phStyles.authorTime}>
                            {dayjs(post.createdAt).fromNow()}
                        </Text>
                    </View>
                </View>

                {!!post.content && (
                    <Text style={phStyles.content}>{post.content}</Text>
                )}

                {images.length > 0 && (
                    <View style={phStyles.imageGrid}>
                        {images.slice(0, 4).map((f, i) => (
                            <AuthImage
                                key={i}
                                filename={f}
                                style={[
                                    phStyles.imageCell,
                                    images.length === 1 && phStyles.imageSingle,
                                ]}
                            />
                        ))}
                    </View>
                )}
            </View>

            <View style={phStyles.commentHeader}>
                <Text style={phStyles.commentTitle}>Bình luận</Text>
            </View>
        </View>
    );
};
const BUBBLE_MINE = BRAND;
const BUBBLE_OTHER = '#F0F2F5';

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── AuthAvatar ────────────────────────────────────────────────────────────────
const AuthAvatar = ({ filename, name, size = 28 }) => {
    const [uri, setUri] = useState(null);

    useEffect(() => {
        if (!filename) return;
        let cancelled = false;
        const { accessToken } = store.getState().auth;
        const url = `${utils.BASE_URL}/document/getFile?filename=${encodeURIComponent(filename)}`;

        RNBlobUtil.fetch('GET', url, { Authorization: `Bearer ${accessToken}` })
            .then((res) => {
                if (!cancelled) setUri(`data:image/jpeg;base64,${res.base64()}`);
            })
            .catch(() => {});

        return () => { cancelled = true; };
    }, [filename]);

    const avatarStyle = { width: size, height: size, borderRadius: size / 2, marginRight: 6 };
    if (uri) {
        return <Image source={{ uri }} style={avatarStyle} />;
    }
    return (
        <View style={[styles.commentAvatar, avatarStyle]}>
            <Text style={[styles.commentAvatarText, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
        </View>
    );
};

// ── Bubble ────────────────────────────────────────────────────────────────────
const Bubble = ({ comment, isMine, showAvatar, canDelete, onDelete }) => {
    const [timeVisible, setTimeVisible] = useState(false);

    return (
        <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
            {!isMine && (
                showAvatar
                    ? <AuthAvatar filename={comment.author_avatar} name={comment.author_name} size={28} />
                    : <View style={styles.bubbleAvatarSpacer} />
            )}

            <View style={[styles.bubbleCol, isMine && styles.bubbleColMine]}>
                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setTimeVisible((v) => !v)}
                    onLongPress={() => {
                        if (canDelete) {
                            Alert.alert('Xóa bình luận?', '', [
                                { text: 'Hủy', style: 'cancel' },
                                { text: 'Xóa', style: 'destructive', onPress: () => onDelete(comment._id) },
                            ]);
                        }
                    }}
                >
                    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                        {!isMine && showAvatar && (
                            <Text style={styles.bubbleName}>{comment.author_name}</Text>
                        )}
                        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                            {comment.content}
                        </Text>
                    </View>
                </TouchableOpacity>

                {timeVisible && (
                    <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                        {dayjs(comment.createdAt).format('HH:mm · DD/MM')}
                    </Text>
                )}
            </View>
        </View>
    );
};

// ── CommentScreen ─────────────────────────────────────────────────────────────
export default function CommentScreen({ route, navigation }) {
    const { post } = route.params;
    const user = useSelector((state) => state.auth.user);
    const isAdmin = user?.role === 'admin';
    const userId = user?.user_id ?? '';

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    const fetchComments = useCallback(async () => {
        try {
            const res = await feedApi.getComments(post._id);
            const items = res?.data?.data ?? res?.data ?? [];
            setComments(items);
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Tải bình luận thất bại' });
        }
    }, [post._id]);

    useEffect(() => {
        fetchComments().finally(() => setLoading(false));
    }, [fetchComments]);

    // Socket: real-time comment
    useEffect(() => {
        socket.emit('join_post', post._id);

        const handleNewComment = ({ comment }) => {
            setComments((prev) => {
                const exists = prev.some((c) => c._id === comment._id);
                return exists ? prev : [...prev, comment];
            });
        };

        const handleCommentDeleted = ({ comment_id }) => {
            setComments((prev) => prev.filter((c) => c._id !== comment_id));
        };

        socket.on('new_comment', handleNewComment);
        socket.on('comment_deleted', handleCommentDeleted);

        return () => {
            socket.emit('leave_post', post._id);
            socket.off('new_comment', handleNewComment);
            socket.off('comment_deleted', handleCommentDeleted);
        };
    }, [post._id]);

    // Scroll xuống khi có comment mới
    useEffect(() => {
        if (comments.length > 0) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
        }
    }, [comments.length]);

    const handleSend = async () => {
        const value = text.trim();
        if (!value || sending) return;
        setSending(true);
        setText('');
        try {
            const res = await feedApi.createComment(post._id, value);
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

    const handleDelete = async (commentId) => {
        try {
            await feedApi.deleteComment(post._id, commentId);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Xóa thất bại' });
        }
    };

    const renderItem = ({ item, index }) => {
        const isMine = item.author_id === userId || item.author_id?.toString() === userId;
        const isOwn = isMine;
        const canDelete = isOwn || isAdmin;
        // Bubble đầu của chuỗi cùng tác giả mới hiện avatar + tên
        const prevComment = index > 0 ? comments[index - 1] : null;
        const showAvatar = !isMine && (
            !prevComment || prevComment.author_id?.toString() !== item.author_id?.toString()
        );

        return (
            <Bubble
                comment={item}
                isMine={isMine}
                showAvatar={showAvatar}
                canDelete={canDelete}
                onDelete={handleDelete}
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
                        ListHeaderComponent={<PostHeader post={post} />}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>Chưa có bình luận nào.</Text>
                                <Text style={styles.emptyText}>Hãy là người đầu tiên!</Text>
                            </View>
                        }
                    />
                )}

                {/* Input bar */}
                <View style={styles.inputBar}>
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
                        style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!text.trim() || sending}
                    >
                        {sending
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="send" size={16} color="#fff" />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ── Styles cho PostHeader ─────────────────────────────────────────────────────
const phStyles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    },
    authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    authorMeta: { flex: 1, marginLeft: 10 },
    authorName: { fontSize: 15, fontWeight: '700', color: '#050505' },
    authorTime: { fontSize: 12, color: '#65676B', marginTop: 1 },
    content: { fontSize: 15, color: '#050505', lineHeight: 22, marginBottom: 10 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, borderRadius: 8, overflow: 'hidden' },
    imageCell: { width: '49.5%', height: 160 },
    imageSingle: { width: '100%', height: 240 },
    commentHeader: {
        paddingHorizontal: 14, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: '#E4E6EB',
        backgroundColor: '#fff',
    },
    commentTitle: { fontSize: 15, fontWeight: '700', color: '#050505' },
});

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F0F2F5' },
    flex: { flex: 1 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 12, paddingVertical: 12, gap: 2 },
    empty: { paddingTop: 80, alignItems: 'center', gap: 4 },
    emptyText: { color: '#9CA3AF', fontSize: 14 },

    // Bubbles
    bubbleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    bubbleRowMine: { flexDirection: 'row-reverse' },

    bubbleAvatarSpacer: { width: 28, marginRight: 6 },

    commentAvatar: { backgroundColor: BRAND, justifyContent: 'center', alignItems: 'center' },
    commentAvatarText: { color: '#fff', fontWeight: '700' },

    bubbleCol: { maxWidth: '72%', alignItems: 'flex-start' },
    bubbleColMine: { alignItems: 'flex-end' },

    bubbleName: { fontSize: 12, color: '#65676B', fontWeight: '600', marginBottom: 3 },

    bubble: {
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 18, maxWidth: '100%',
    },
    bubbleMine: {
        backgroundColor: BUBBLE_MINE,
        borderTopRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: BUBBLE_OTHER,
        borderTopLeftRadius: 4,
    },
    bubbleText: { fontSize: 15, color: '#050505', lineHeight: 20 },
    bubbleTextMine: { color: '#fff' },

    bubbleTime: { fontSize: 11, color: '#65676B', marginTop: 3, marginLeft: 10 },
    bubbleTimeMine: { marginLeft: 0, marginRight: 10 },

    // Input bar
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 12, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: '#E4E6EB',
        backgroundColor: '#fff', gap: 8,
    },
    input: {
        flex: 1, minHeight: 38, maxHeight: 120,
        backgroundColor: '#F0F2F5', borderRadius: 22,
        paddingHorizontal: 16, paddingVertical: 9,
        fontSize: 15, color: '#050505',
    },
    sendBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: BRAND,
        justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#BCC0C4' },
});
