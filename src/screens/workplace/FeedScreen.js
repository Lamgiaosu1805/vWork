import React, { useCallback, useEffect, useRef, useState } from "react";
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
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

import { openDrawer } from "../../helpers/navigationRef";
import { canMgr } from "../../helpers/permissions";
import Header from "../../components/Header";
import PostCard, { AuthAvatar, BRAND } from "../../components/PostCard";
import feedApi from "../../api/feedApi";
import socket from "../../libs/socket";
import { CircleUserRound, Menu } from "lucide-react-native";
import useSocketStatus from "../../hooks/workplace/useSocketStatus";
import ConnectionStatusBar from "../../components/workplace/chat/ConnectionStatusBar";

const PAGE_SIZE = 10;

// ── FeedScreen ────────────────────────────────────────────────────────────────
export default function FeedScreen({ navigation }) {
  const user = useSelector((state) => state.auth.user);
  const canManage = canMgr(user, "workplace");
  const listRef = useRef(null);
  const socketStatus = useSocketStatus();

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
      Toast.show({
        type: "error",
        text1: err?.message ?? "Tải bảng tin thất bại",
      });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPosts(1, true).finally(() => setLoading(false));
  }, [fetchPosts]);

  useEffect(() => {
    socket.emit("join_feed");

    const handleNewPost = ({ post }) => {
      setPendingPosts((prev) => {
        if (prev.some((p) => p._id === post._id)) return prev;
        return [post, ...prev];
      });
    };
    const handleReactionUpdated = ({ post_id, reactions }) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === post_id ? { ...p, reactions } : p)),
      );
    };
    const handleCommentCountUpdated = ({ post_id, comments_count }) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === post_id ? { ...p, comments_count } : p)),
      );
    };
    const handlePostDeleted = ({ post_id }) => {
      setPosts((prev) => prev.filter((p) => p._id !== post_id));
      setPendingPosts((prev) => prev.filter((p) => p._id !== post_id));
    };
    const handlePostPinned = () => {
      fetchPosts(1, true);
    };

    socket.on("new_post", handleNewPost);
    socket.on("reaction_updated", handleReactionUpdated);
    socket.on("comment_count_updated", handleCommentCountUpdated);
    socket.on("post_deleted", handlePostDeleted);
    socket.on("post_pinned", handlePostPinned);

    return () => {
      socket.emit("leave_feed");
      socket.off("new_post", handleNewPost);
      socket.off("reaction_updated", handleReactionUpdated);
      socket.off("comment_count_updated", handleCommentCountUpdated);
      socket.off("post_deleted", handlePostDeleted);
      socket.off("post_pinned", handlePostPinned);
    };
  }, [fetchPosts]);

  const flushPending = () => {
    setPosts((prev) => {
      const toAdd = pendingPosts.filter(
        (p) => !prev.some((x) => x._id === p._id),
      );
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
      Toast.show({ type: "error", text1: err?.message ?? "Thao tác thất bại" });
    }
  };

  const handleDelete = async (postId) => {
    try {
      await feedApi.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      Toast.show({ type: "success", text1: "Đã xóa bài viết" });
    } catch (err) {
      Toast.show({ type: "error", text1: err?.message ?? "Xóa thất bại" });
    }
  };

  const handlePin = async (postId) => {
    try {
      await feedApi.pinPost(postId);
      await fetchPosts(1, true);
    } catch (err) {
      Toast.show({ type: "error", text1: err?.message ?? "Thao tác thất bại" });
    }
  };

  // Compose bar — hiện ở đầu danh sách
  const ComposeBar = (
    <TouchableOpacity
      style={styles.composeTap}
      onPress={() => navigation.navigate("ComposePostScreen")}
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
        onRightPress={() => navigation.navigate("WorkplaceProfileScreen")}
      />
      <ConnectionStatusBar status={socketStatus} />

      {/* Banner bài mới */}
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
              onCommentPress={(p) =>
                navigation.navigate("FeedCommentScreen", { post: p })
              }
              onAuthorPress={(id) =>
                navigation.navigate("WorkplaceProfileScreen", { accountId: id })
              }
              canManage={canManage}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={BRAND}
            />
          }
          onEndReached={handleLoadMore}
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingVertical: 8 },
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
