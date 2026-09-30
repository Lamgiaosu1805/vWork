import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { openDrawer } from "../../../../helpers/navigationRef";
import { canMgr } from "../../../../helpers/permissions";
import Header from "../../../../components/Header";
import PostCard, { AuthAvatar, BRAND } from "../../../../components/PostCard";
import socket from "../../../../libs/socket";
import { CircleUserRound, Menu } from "lucide-react-native";
import useSocketStatus from "../../../../features/workplace/hooks/useSocketStatus";
import ConnectionStatusBar from "../../../../features/workplace/components/chat/ConnectionStatusBar";
import useFeedPostsInfinite from "../../../../features/workplace/hooks/useFeedPostsInfinite";
import useReactPost from "../../../../features/workplace/hooks/useReactPost";
import useDeletePost from "../../../../features/workplace/hooks/useDeletePost";
import usePinPost from "../../../../features/workplace/hooks/usePinPost";
import { Skeleton, SkeletonCircle } from "../../../../components/Skeleton";

const FEED_QUERY_KEY = ["posts", {}];

const patchPostInCache = (queryClient, postId, updater) => {
  queryClient.setQueryData(FEED_QUERY_KEY, (old) => {
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

const removePostFromCache = (queryClient, postId) => {
  queryClient.setQueryData(FEED_QUERY_KEY, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.filter((p) => p._id !== postId),
      })),
    };
  });
};

export default function FeedScreen() {
  const user = useSelector((state) => state.auth.user);
  const canManage = canMgr(user, "workplace");
  const listRef = useRef(null);
  const socketStatus = useSocketStatus();
  const queryClient = useQueryClient();

  const [pendingPosts, setPendingPosts] = useState([]);

  const {
    data,
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
    isFetchingNextPage: loadingMore,
    hasNextPage,
    fetchNextPage,
  } = useFeedPostsInfinite();
  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  const reactPost = useReactPost();
  const deletePost = useDeletePost();
  const pinPost = usePinPost();

  useEffect(() => {
    const joinFeed = () => socket.emit("join_feed");

    joinFeed();
    socket.on("connect", joinFeed);

    const handleNewPost = ({ post }) => {
      setPendingPosts((prev) => {
        if (prev.some((p) => p._id === post._id)) return prev;
        return [post, ...prev];
      });
    };
    const handleReactionUpdated = ({ post_id, reactions }) =>
      patchPostInCache(queryClient, post_id, (p) => ({ ...p, reactions }));
    const handleCommentCountUpdated = ({ post_id, comments_count }) =>
      patchPostInCache(queryClient, post_id, (p) => ({ ...p, comments_count }));
    const handlePostDeleted = ({ post_id }) => {
      removePostFromCache(queryClient, post_id);
      setPendingPosts((prev) => prev.filter((p) => p._id !== post_id));
    };
    const handlePostPinned = () => refetch();
    const handlePostUpdated = ({ post }) =>
      patchPostInCache(queryClient, post._id, () => post);

    socket.on("new_post", handleNewPost);
    socket.on("reaction_updated", handleReactionUpdated);
    socket.on("comment_count_updated", handleCommentCountUpdated);
    socket.on("post_deleted", handlePostDeleted);
    socket.on("post_pinned", handlePostPinned);
    socket.on("post_updated", handlePostUpdated);

    return () => {
      socket.emit("leave_feed");
      socket.off("connect", joinFeed);
      socket.off("new_post", handleNewPost);
      socket.off("reaction_updated", handleReactionUpdated);
      socket.off("comment_count_updated", handleCommentCountUpdated);
      socket.off("post_deleted", handlePostDeleted);
      socket.off("post_pinned", handlePostPinned);
      socket.off("post_updated", handlePostUpdated);
    };
  }, [queryClient, refetch]);

  const handleEdit = (post) => {
    router.push({ pathname: "/workplace/compose-post", params: { editPost: JSON.stringify(post) } });
  };

  const flushPending = () => {
    queryClient.setQueryData(FEED_QUERY_KEY, (old) => {
      if (!old) return old;
      const existingIds = new Set(old.pages.flatMap((pg) => pg.items.map((p) => p._id)));
      const toAdd = pendingPosts.filter((p) => !existingIds.has(p._id));
      const [firstPage, ...restPages] = old.pages;
      return {
        ...old,
        pages: [{ ...firstPage, items: [...toAdd, ...firstPage.items] }, ...restPages],
      };
    });
    setPendingPosts([]);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleReact = (postId, type) => {
    reactPost.mutate(
      { postId, type },
      { onError: (err) => Toast.show({ type: "error", text1: err?.message ?? "Thao tác thất bại" }) },
    );
  };

  const handleDelete = (postId) => {
    deletePost.mutate(postId, {
      onSuccess: () => {
        removePostFromCache(queryClient, postId);
        Toast.show({ type: "success", text1: "Đã xóa bài viết" });
      },
      onError: (err) => Toast.show({ type: "error", text1: err?.message ?? "Xóa thất bại" }),
    });
  };

  const handlePin = (postId) => {
    pinPost.mutate(postId, {
      onSuccess: () => refetch(),
      onError: (err) => Toast.show({ type: "error", text1: err?.message ?? "Thao tác thất bại" }),
    });
  };

  const ComposeBar = (
    <TouchableOpacity
      style={styles.composeTap}
      onPress={() => router.push("/workplace/compose-post")}
      activeOpacity={0.85}
    >
      <AuthAvatar
        filename={user?.avatar}
        name={user?.full_name ?? user?.username ?? ""}
        size={36}
        cacheKey={user?.updatedAt}
      />
      <View style={styles.composePlaceholder}>
        <Text style={styles.composePlaceholderText}>Bạn đang nghĩ gì?</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safe}>
      <Header
        title="Bảng tin"
        LeftIcon={Menu}
        onLeftPress={openDrawer}
        RightIcon={CircleUserRound}
        onRightPress={() => router.push("/workplace/profile")}
      />
      <ConnectionStatusBar status={socketStatus} />

      {pendingPosts.length > 0 && (
        <TouchableOpacity
          style={styles.newsBanner}
          onPress={flushPending}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up-circle" size={16} color="#fff" />
          <Text style={styles.newsBannerText}>
            {pendingPosts.length} bài viết mới
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <SkeletonCircle size={40} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="40%" height={13} />
                  <Skeleton width="25%" height={11} />
                </View>
              </View>
              <Skeleton width="90%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="70%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={140} borderRadius={10} />
            </View>
          ))}
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
              onEdit={handleEdit}
              onCommentPress={(p) =>
                router.push({ pathname: "/workplace/comment", params: { post: JSON.stringify(p) } })
              }
              onAuthorPress={(id) =>
                router.push({ pathname: "/workplace/profile", params: { accountId: id } })
              }
              canManage={canManage}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetch}
              tintColor={BRAND}
            />
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={BRAND} />
              </View>
            ) : null
          }
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F2F5" },
  list: { paddingVertical: 8 },
  skeletonCard: { backgroundColor: "#fff", padding: 14, marginHorizontal: 8, marginBottom: 8, borderRadius: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { color: "#9CA3AF", fontSize: 14 },
  footerLoader: { paddingVertical: 20, alignItems: "center" },

  newsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: BRAND,
    paddingVertical: 9,
  },
  newsBannerText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  composeTap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  composePlaceholder: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  composePlaceholderText: { fontSize: 15, color: "#8A8D91" },
});
