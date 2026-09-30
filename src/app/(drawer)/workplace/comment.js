import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { router, useLocalSearchParams } from "expo-router";

import socket from "../../../libs/socket";
import { canMgr } from "../../../helpers/permissions";
import Header from "../../../components/Header";
import PostCard, { AuthAvatar, BRAND } from "../../../components/PostCard";
import { ChevronLeft } from "lucide-react-native";
import ConnectionStatusBar from "../../../features/workplace/components/chat/ConnectionStatusBar";
import useSocketStatus from "../../../features/workplace/hooks/useSocketStatus";
import useComments from "../../../features/workplace/hooks/useComments";
import { Skeleton, SkeletonCircle } from "../../../components/Skeleton";
import useReactPost from "../../../features/workplace/hooks/useReactPost";
import useDeletePost from "../../../features/workplace/hooks/useDeletePost";
import useCreateComment from "../../../features/workplace/hooks/useCreateComment";
import useCreateCommentWithImage from "../../../features/workplace/hooks/useCreateCommentWithImage";
import useDeleteComment from "../../../features/workplace/hooks/useDeleteComment";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const ImageViewerModal = ({ visible, uri, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.viewerBackdrop}>
      <TouchableOpacity
        style={styles.viewerCloseBtn}
        onPress={onClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
      <ScrollView
        style={styles.viewerScroll}
        contentContainerStyle={styles.viewerScrollContent}
        minimumZoomScale={1}
        maximumZoomScale={4}
        centerContent
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {!!uri && (
          <Image
            source={{ uri }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
        )}
      </ScrollView>
    </View>
  </Modal>
);

const CommentItem = ({ comment, canDelete, onDelete, onImagePress }) => {
  const [timeVisible, setTimeVisible] = useState(false);

  return (
    <View style={styles.commentItem}>
      <AuthAvatar
        filename={comment.author_avatar}
        name={comment.author_name}
        size={32}
      />
      <View style={styles.commentBody}>
        <View style={styles.commentBubble}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTimeVisible((v) => !v)}
            onLongPress={() => {
              if (!canDelete) return;
              Alert.alert("Xóa bình luận?", "", [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Xóa",
                  style: "destructive",
                  onPress: () => onDelete(comment._id),
                },
              ]);
            }}
          >
            {!!comment.author_name && (
              <Text style={styles.commentAuthor}>{comment.author_name}</Text>
            )}
            {!!comment.content && (
              <Text style={styles.commentContent}>{comment.content}</Text>
            )}
          </TouchableOpacity>

          {!!comment.image && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onImagePress(comment.image)}
            >
              <Image
                source={{ uri: comment.image }}
                style={styles.commentImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        </View>
        {timeVisible && (
          <Text style={styles.commentTime}>
            {dayjs(comment.createdAt).fromNow()}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function CommentScreen() {
  const { post: postParam } = useLocalSearchParams();
  const initialPost = JSON.parse(postParam);
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const userId = user?.user_id ?? "";
  const canManagePost = canMgr(user, "workplace");
  const socketStatus = useSocketStatus();
  const queryClient = useQueryClient();
  const commentsQueryKey = ["comments", initialPost._id];

  const [postState, setPostState] = useState(initialPost);
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const { data: comments = [], isLoading: loading } = useComments(initialPost._id);
  const reactPost = useReactPost();
  const deletePost = useDeletePost();
  const createComment = useCreateComment();
  const createCommentWithImage = useCreateCommentWithImage();
  const deleteCommentMutation = useDeleteComment();
  const sending = createComment.isPending || createCommentWithImage.isPending;

  useEffect(() => {
    socket.emit("join_post", initialPost._id);

    const handleNewComment = ({ comment }) => {
      queryClient.setQueryData(commentsQueryKey, (prev = []) => {
        const exists = prev.some((c) => c._id === comment._id);
        return exists ? prev : [...prev, comment];
      });
    };
    const handleCommentDeleted = ({ comment_id }) => {
      queryClient.setQueryData(commentsQueryKey, (prev = []) =>
        prev.filter((c) => c._id !== comment_id),
      );
    };
    const handleReactionUpdated = ({ post_id, reactions }) => {
      if (post_id === initialPost._id) {
        setPostState((p) => ({ ...p, reactions }));
      }
    };

    socket.on("new_comment", handleNewComment);
    socket.on("comment_deleted", handleCommentDeleted);
    socket.on("reaction_updated", handleReactionUpdated);

    return () => {
      socket.emit("leave_post", initialPost._id);
      socket.off("new_comment", handleNewComment);
      socket.off("comment_deleted", handleCommentDeleted);
      socket.off("reaction_updated", handleReactionUpdated);
    };
  }, [initialPost._id, queryClient]);

  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [comments.length]);

  const handleReact = (postId, type) => {
    reactPost.mutate(
      { postId, type },
      { onError: (err) => Toast.show({ type: "error", text1: err?.message ?? "Thao tác thất bại" }) },
    );
  };

  const handleDeletePost = (postId) => {
    deletePost.mutate(postId, {
      onSuccess: () => router.back(),
      onError: (err) => Toast.show({ type: "error", text1: err?.message ?? "Xóa thất bại" }),
    });
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Cần quyền truy cập thư viện ảnh" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    const value = text.trim();
    if ((!value && !imageUri) || sending) return;

    const pendingText = value;
    const pendingImage = imageUri;
    setText("");
    setImageUri(null);

    try {
      const res = pendingImage
        ? await createCommentWithImage.mutateAsync({
            postId: initialPost._id,
            content: pendingText,
            imageUri: pendingImage,
          })
        : await createComment.mutateAsync({ postId: initialPost._id, content: pendingText });

      const newComment = res?.data?.data ?? res?.data ?? res;
      if (newComment?._id) {
        queryClient.setQueryData(commentsQueryKey, (prev = []) => {
          const exists = prev.some((c) => c._id === newComment._id);
          return exists ? prev : [...prev, newComment];
        });
      }
    } catch (err) {
      setText(pendingText);
      setImageUri(pendingImage);
      Toast.show({ type: "error", text1: err?.message ?? "Gửi thất bại" });
    }
  };

  const handleDeleteComment = (commentId) => {
    deleteCommentMutation.mutate(
      { postId: initialPost._id, commentId },
      {
        onSuccess: () => {
          queryClient.setQueryData(commentsQueryKey, (prev = []) =>
            prev.filter((c) => c._id !== commentId),
          );
        },
        onError: (err) => Toast.show({ type: "error", text1: err?.message ?? "Xóa thất bại" }),
      },
    );
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
        onAuthorPress={(id) =>
          router.push({ pathname: "/workplace/profile", params: { accountId: id } })
        }
        showPreviewComments={false}
      />
      <View style={styles.commentsLabel}>
        <Text style={styles.commentsLabelText}>
          Bình luận{comments.length > 0 ? ` (${comments.length})` : ""}
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const isMine =
      item.author_id === userId || item.author_id?.toString() === userId;
    const canDelete = isMine || isAdmin;
    return (
      <CommentItem
        comment={item}
        canDelete={canDelete}
        onDelete={handleDeleteComment}
        onImagePress={setViewerImage}
      />
    );
  };

  const canSend = (!!text.trim() || !!imageUri) && !sending;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <Header
        title="Bài viết"
        LeftIcon={ChevronLeft}
        onLeftPress={() => router.back()}
      />

      <ConnectionStatusBar status={socketStatus} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={{ padding: 12, gap: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.commentItem}>
                <SkeletonCircle size={32} />
                <View style={styles.commentBody}>
                  <View style={[styles.commentBubble, { gap: 6 }]}>
                    <Skeleton width={90} height={11} />
                    <Skeleton width={150} height={12} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={comments}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            style={{ backgroundColor: "#fff" }}
            contentContainerStyle={styles.list}
            ListHeaderComponent={CommentsHeader}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Chưa có bình luận nào.</Text>
                <Text style={styles.emptyText}>Hãy là người đầu tiên!</Text>
              </View>
            }
          />
        )}

        {!!imageUri && (
          <View style={styles.previewBar}>
            <Image source={{ uri: imageUri }} style={styles.previewThumb} />
            <TouchableOpacity
              style={styles.previewRemove}
              onPress={() => setImageUri(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color="#65676B" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          <AuthAvatar
            filename={user?.avatar}
            name={user?.full_name ?? user?.username ?? ""}
            size={32}
            cacheKey={user?.updatedAt}
          />
          <View style={styles.inputWrap}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.imagePickIcon}
            >
              <Ionicons name="image-outline" size={22} color={BRAND} />
            </TouchableOpacity>
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
              disabled={!canSend}
              style={styles.sendIcon}
            >
              {sending ? (
                <ActivityIndicator size="small" color={BRAND} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={canSend ? BRAND : "#BCC0C4"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      <ImageViewerModal
        visible={!!viewerImage}
        uri={viewerImage}
        onClose={() => setViewerImage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F2F5" },
  flex: { flex: 1 },

  list: { paddingBottom: 8 },

  commentsLabel: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  commentsLabelText: { fontSize: 15, fontWeight: "700", color: "#050505" },

  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  commentBody: { flex: 1 },
  commentBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F2F5",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "95%",
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#050505",
    marginBottom: 2,
  },
  commentContent: { fontSize: 14, color: "#050505", lineHeight: 20 },
  commentImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: "#E4E6EB",
  },
  commentTime: { fontSize: 11, color: "#65676B", marginTop: 4, marginLeft: 12 },

  empty: {
    backgroundColor: "#fff",
    paddingTop: 40,
    alignItems: "center",
    gap: 4,
  },
  emptyText: { color: "#9CA3AF", fontSize: 14 },

  previewBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "#fff",
  },
  previewThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#E4E6EB",
  },
  previewRemove: {
    marginLeft: -12,
    marginTop: -40,
    backgroundColor: "#fff",
    borderRadius: 10,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E4E6EB",
    backgroundColor: "#fff",
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F0F2F5",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  imagePickIcon: { paddingBottom: 4 },
  input: {
    flex: 1,
    minHeight: 28,
    maxHeight: 100,
    fontSize: 15,
    color: "#050505",
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendIcon: { paddingBottom: 2 },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  viewerScroll: {
    flex: 1,
  },
  viewerScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
  viewerCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
  },
});
