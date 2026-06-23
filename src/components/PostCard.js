import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RNBlobUtil from "react-native-blob-util";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import ImageView from "react-native-image-viewing";

import { store } from "../redux/store";
import utils from "../helpers/utils";
import feedApi from "../api/feedApi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export const BRAND = "#ED2E30";

export const REACTIONS = [
  { type: "like", emoji: "👍", label: "Thích", color: "#1877F2" },
  { type: "love", emoji: "❤️", label: "Yêu thích", color: "#ED2E30" },
  { type: "haha", emoji: "😆", label: "Haha", color: "#F7B928" },
  { type: "wow", emoji: "😮", label: "Wow", color: "#F7B928" },
  { type: "sad", emoji: "😢", label: "Buồn", color: "#F7B928" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ", color: "#E9710F" },
];
export const REACTION_MAP = Object.fromEntries(
  REACTIONS.map((r) => [r.type, r]),
);

export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getTopReactions(reactions) {
  const counts = {};
  reactions.forEach((r) => {
    counts[r.type] = (counts[r.type] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

// ── AuthImage ─────────────────────────────────────────────────────────────────
export const AuthImage = ({ filename, style, resizeMode = "cover" }) => {
  // const [uri, setUri] = useState(null);
  const url = `${utils.BASE_URL}/static/${filename}`;

  // useEffect(() => {
  //   if (!filename) return;
  //   let cancelled = false;
  //   const { accessToken } = store.getState().auth;
  //   const url = `${utils.BASE_URL}/document/getFile?filename=${encodeURIComponent(filename)}`;

  //   RNBlobUtil.fetch("GET", url, { Authorization: `Bearer ${accessToken}` })
  //     .then((res) => {
  //   console.log(res.base64());

  //       if (!cancelled) setUri(`data:image/jpeg;base64,${res.base64()}`);
  //     })
  //     .catch((e) => {
  //       console.error("Error fetching image:", e);
  //     });
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [filename]);
  
  if (!url) return <View style={[style, s.imgPlaceholder]} />;
  return <Image source={{ uri: url }} style={style} resizeMode={resizeMode} />;
};

// ── AuthAvatar ────────────────────────────────────────────────────────────────
export const AuthAvatar = ({
  filename,
  name,
  size = 40,
  cacheKey,
  isFlex = false,
}) => {
  const url = `${utils.BASE_URL}/static/${filename}`;

  // const [uri, setUri] = useState(null);
  // useEffect(() => {
  //   if (!filename) return;
  //   let cancelled = false;
  //   setUri(null);
  //   const { accessToken } = store.getState().auth;
  //   const url = `${utils.BASE_URL}/document/getFile?filename=${encodeURIComponent(filename)}`;
  //   RNBlobUtil.fetch("GET", url, { Authorization: `Bearer ${accessToken}` })
  //     .then((res) => {
  //       if (!cancelled) setUri(`data:image/jpeg;base64,${res.base64()}`);
  //     })
  //     .catch(() => {});
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [filename, cacheKey]);
  const sz = isFlex
    ? {
        width: "100%",
        height: "100%",
        borderRadius: 0,
        marginRight: 0,
      }
    : {
        width: size,
        height: size,
        borderRadius: size / 2,
        marginRight: 7,
      };
  if (url) return <Image source={{ uri: url }} style={sz} resizeMode="cover" />;
  return (
    <View style={[s.avatarFallback, sz]}>
      <Text style={[s.avatarInitials, { fontSize: size * 0.38 }]}>
        {getInitials(name)}
      </Text>
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
        <AuthImage filename={images[0]} style={s.img1} />
      </TouchableOpacity>
    );
  }
  if (count === 2) {
    return (
      <View style={s.imgRow}>
        {images.slice(0, 2).map((f, i) => (
          <TouchableOpacity
            key={i}
            style={s.img2Wrap}
            onPress={() => onImagePress(i)}
            activeOpacity={0.9}
          >
            <AuthImage filename={f} style={s.imgFill} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  if (count === 3) {
    return (
      <View style={s.imgRow}>
        <TouchableOpacity
          style={s.img3Left}
          onPress={() => onImagePress(0)}
          activeOpacity={0.9}
        >
          <AuthImage filename={images[0]} style={s.imgFill} />
        </TouchableOpacity>
        <View style={s.img3Right}>
          {images.slice(1, 3).map((f, i) => (
            <TouchableOpacity
              key={i}
              style={s.img3RightCell}
              onPress={() => onImagePress(i + 1)}
              activeOpacity={0.9}
            >
              <AuthImage filename={f} style={s.imgFill} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={s.imgGrid2x2}>
      {images.slice(0, 4).map((f, i) => (
        <TouchableOpacity
          key={i}
          style={s.img4Cell}
          onPress={() => onImagePress(i)}
          activeOpacity={0.9}
        >
          <AuthImage filename={f} style={s.imgFill} />
          {i === 3 && more > 0 && (
            <View style={s.moreOverlay}>
              <Text style={s.moreText}>+{more}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ── ReactionButton ────────────────────────────────────────────────────────────
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
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 10,
      }).start();
    });
  };

  const closePicker = (cb) => {
    Animated.timing(pickerAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setPickerVisible(false);
      cb?.();
    });
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(tapScale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 30,
      }),
      Animated.spring(tapScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
      }),
    ]).start();
    onReact(myReaction?.type ?? "like");
  };

  return (
    <>
      <Pressable
        ref={btnRef}
        collapsable={false}
        style={s.actionBtn}
        onPress={handlePress}
        onLongPress={openPicker}
        delayLongPress={400}
      >
        <Animated.Text
          style={{ fontSize: 20, transform: [{ scale: tapScale }] }}
        >
          {currentR?.emoji ?? "👍"}
        </Animated.Text>
        <Text style={[s.actionLabel, currentR && { color: currentR.color }]}>
          {currentR?.label ?? "Thích"}
        </Text>
      </Pressable>

      <Modal
        visible={pickerVisible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closePicker()}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => closePicker()}
        >
          <Animated.View
            style={[
              s.pickerStrip,
              { top: pickerTop },
              {
                opacity: pickerAnim,
                transform: [
                  {
                    scale: pickerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {REACTIONS.map((r) => (
              <Pressable
                key={r.type}
                onPress={() => closePicker(() => onReact(r.type))}
                style={s.pickerItemCircle}
              >
                <Text style={s.pickerEmojiLarge}>{r.emoji}</Text>
                {myReaction?.type === r.type && (
                  <View style={s.pickerActiveDot} />
                )}
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

// ── ReactionsModal ────────────────────────────────────────────────────────────
export const ReactionsModal = ({ visible, onClose, reactions }) => {
  const [filter, setFilter] = useState("all");
  const types = [...new Set(reactions.map((r) => r.type))];
  const shown =
    filter === "all" ? reactions : reactions.filter((r) => r.type === filter);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.rmOverlay}>
        <View style={s.rmSheet}>
          <View style={s.rmHeader}>
            <Text style={s.rmTitle}>Cảm xúc</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#65676B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.rmTabs}
            contentContainerStyle={{ gap: 6 }}
          >
            <TouchableOpacity
              onPress={() => setFilter("all")}
              style={[s.rmTab, filter === "all" && s.rmTabActive]}
            >
              <Text
                style={[s.rmTabText, filter === "all" && s.rmTabTextActive]}
              >
                Tất cả {reactions.length}
              </Text>
            </TouchableOpacity>
            {types.map((type) => {
              const r = REACTION_MAP[type];
              const count = reactions.filter((x) => x.type === type).length;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setFilter(type)}
                  style={[s.rmTab, filter === type && s.rmTabActive]}
                >
                  <Text
                    style={[s.rmTabText, filter === type && s.rmTabTextActive]}
                  >
                    {r.emoji} {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={s.rmDivider} />

          <FlatList
            data={shown}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={s.rmRow}>
                <AuthAvatar
                  filename={item.author_avatar}
                  name={item.author_name ?? "?"}
                  size={36}
                />
                <Text style={s.rmName} numberOfLines={1}>
                  {item.author_name ?? "Người dùng"}
                </Text>
                <Text style={s.rmEmoji}>{REACTION_MAP[item.type]?.emoji}</Text>
              </View>
            )}
            style={{ maxHeight: 340 }}
            ListEmptyComponent={
              <Text style={s.rmEmpty}>Chưa có cảm xúc nào</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

// ── PostCard ──────────────────────────────────────────────────────────────────
const PostCard = ({
  post,
  currentUser,
  onReact,
  onDelete,
  onPin,
  onCommentPress,
  canManage,
  onAuthorPress,
  showPreviewComments = true,
}) => {
  const userId = String(currentUser?.id ?? currentUser?._id ?? "");
  const myReaction = (post.reactions ?? []).find(
    (r) => String(r.user_id) === userId,
  );
  const isAuthor =
    post.author_id === userId || post.author_id?.toString() === userId;
  const [expanded, setExpanded] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [previewComments, setPreviewComments] = useState([]);

  useEffect(() => {
    if (!showPreviewComments || !post.comments_count) {
      setPreviewComments([]);
      return;
    }
    let cancelled = false;
    feedApi
      .getComments(post._id, { page: 1, limit: 2, sort: "desc" })
      .then((res) => {
        if (!cancelled) {
          const items = res?.data?.data ?? [];
          setPreviewComments([...items].reverse());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [post._id, post.comments_count, showPreviewComments]);

  const totalReactions = post.reactions?.length ?? 0;
  const legacyLikes = !post.reactions ? post.likes : null;
  const topReactions = post.reactions?.length
    ? getTopReactions(post.reactions)
    : [];

  const showMenu = () => {
    const options = [];
    if (canManage && onPin) options.push(post.pinned ? "Bỏ ghim" : "Ghim bài");
    if (isAuthor || canManage) options.push("Xóa bài viết");
    if (!options.length) return;
    Alert.alert("", "", [
      ...options.map((opt) => ({
        text: opt,
        style: opt.includes("Xóa") ? "destructive" : "default",
        onPress: () => {
          if (opt.includes("ghim") || opt.includes("Ghim")) onPin?.(post._id);
          else {
            Alert.alert("Xóa bài viết?", "Bài viết sẽ bị xóa vĩnh viễn.", [
              { text: "Hủy", style: "cancel" },
              {
                text: "Xóa",
                style: "destructive",
                onPress: () => onDelete(post._id),
              },
            ]);
          }
        },
      })),
      { text: "Đóng", style: "cancel" },
    ]);
  };

  const imageViewerData = useMemo(
    () =>
      (post.images ?? []).map((img) => ({
        uri: `${utils.BASE_URL}/static/${img}`,
      })),
    [post.images],
  );

  return (
    <View style={s.card}>
      {post.pinned && (
        <View style={s.pinnedBar}>
          <Ionicons name="pin" size={12} color="#F59E0B" />
          <Text style={s.pinnedText}>Bài ghim</Text>
        </View>
      )}

      <View style={s.authorRow}>
        <TouchableOpacity
          onPress={() => onAuthorPress?.(post.author_id)}
          activeOpacity={0.7}
        >
          <AuthAvatar
            filename={post.author_avatar}
            name={post.author_name}
            size={40}
          />
        </TouchableOpacity>
        <View style={s.authorMeta}>
          <View style={s.authorNameRow}>
            <TouchableOpacity
              onPress={() => onAuthorPress?.(post.author_id)}
              activeOpacity={0.7}
            >
              <Text style={s.authorName}>{post.author_name}</Text>
            </TouchableOpacity>
            {post.type === "announcement" && (
              <View style={s.announceBadge}>
                <Text style={s.announceText}>Thông báo</Text>
              </View>
            )}
          </View>
          <Text style={s.authorTime}>{dayjs(post.createdAt).fromNow()}</Text>
        </View>
        {(isAuthor || canManage) && (
          <TouchableOpacity onPress={showMenu} hitSlop={12} style={s.menuBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
          </TouchableOpacity>
        )}
      </View>

      {!!post.content && (
        <View style={s.contentWrap}>
          <Text style={s.content} numberOfLines={expanded ? undefined : 5}>
            {post.content}
          </Text>
          {post.content.length > 200 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={s.seeMore}>{expanded ? "Ẩn bớt" : "Xem thêm"}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ImageGrid
        images={post.images}
        onImagePress={(idx) => setLightboxIdx(idx)}
      />

      {(totalReactions > 0 ||
        legacyLikes?.length > 0 ||
        post.comments_count > 0) && (
        <View style={s.statsRow}>
          {totalReactions > 0 ? (
            <TouchableOpacity
              style={s.statsItem}
              onPress={() => setReactionsOpen(true)}
              activeOpacity={0.7}
            >
              <View style={s.reactionEmojis}>
                {topReactions.map(([type]) => (
                  <Text key={type} style={{ fontSize: 13 }}>
                    {REACTION_MAP[type]?.emoji}
                  </Text>
                ))}
              </View>
              <Text style={s.statsText}>{totalReactions}</Text>
            </TouchableOpacity>
          ) : legacyLikes?.length > 0 ? (
            <View style={s.statsItem}>
              <View style={s.likeIcon}>
                <Ionicons name="heart" size={11} color="#fff" />
              </View>
              <Text style={s.statsText}>{legacyLikes.length}</Text>
            </View>
          ) : null}
          {post.comments_count > 0 && (
            <TouchableOpacity
              onPress={() => onCommentPress(post)}
              activeOpacity={0.7}
              style={{ marginLeft: "auto" }}
            >
              <Text style={s.statsText}>{post.comments_count} bình luận</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={s.divider} />
      <View style={s.actionsRow}>
        <ReactionButton
          myReaction={myReaction}
          onReact={(type) => onReact(post._id, type)}
        />
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => onCommentPress(post)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#65676B" />
          <Text style={s.actionLabel}>Bình luận</Text>
        </TouchableOpacity>
      </View>

      {showPreviewComments && previewComments.length > 0 && (
        <View style={s.previewWrap}>
          {post.comments_count > 2 && (
            <TouchableOpacity
              onPress={() => onCommentPress(post)}
              activeOpacity={0.7}
            >
              <Text style={s.viewAllComments}>
                Xem tất cả {post.comments_count} bình luận
              </Text>
            </TouchableOpacity>
          )}
          {previewComments.map((c) => (
            <View key={c._id} style={s.previewComment}>
              <AuthAvatar
                filename={c.author_avatar}
                name={c.author_name}
                size={28}
              />
              <View style={s.previewBubble}>
                <Text style={s.previewName}>{c.author_name}</Text>
                <Text style={s.previewText}>{c.content}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* <Modal
        visible={lightboxIdx !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxIdx(null)}
      >
        <Pressable style={s.lightboxBg} onPress={() => setLightboxIdx(null)}>
          {lightboxIdx !== null && post.images?.[lightboxIdx] && (
            <AuthImage
              filename={post.images[lightboxIdx]}
              style={s.lightboxImg}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal> */}

      <ImageView
        images={imageViewerData}
        imageIndex={lightboxIdx ?? 0}
        visible={lightboxIdx !== null}
        onRequestClose={() => setLightboxIdx(null)}
      />

      <ReactionsModal
        visible={reactionsOpen}
        onClose={() => setReactionsOpen(false)}
        reactions={post.reactions ?? []}
      />
    </View>
  );
};

export default PostCard;

// ── Styles ────────────────────────────────────────────────────────────────────
const IMG_HEIGHT = 240;
const IMG_GRID = 180;

const s = StyleSheet.create({
  // Card
  card: { backgroundColor: "#fff" },
  pinnedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  pinnedText: { fontSize: 12, color: "#F59E0B", fontWeight: "600" },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: { color: "#fff", fontWeight: "700" },
  authorMeta: { flex: 1 },
  authorNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontSize: 15, fontWeight: "700", color: "#050505" },
  announceBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  announceText: { fontSize: 11, color: BRAND, fontWeight: "700" },
  authorTime: { fontSize: 12, color: "#65676B", marginTop: 1 },
  menuBtn: { padding: 4 },

  contentWrap: { paddingHorizontal: 14, paddingBottom: 10 },
  content: { fontSize: 15, color: "#050505", lineHeight: 22 },
  seeMore: { fontSize: 14, color: "#65676B", marginTop: 2, fontWeight: "500" },

  imgPlaceholder: { backgroundColor: "#E4E6EB" },
  img1: { width: "100%", height: IMG_HEIGHT },
  imgRow: { flexDirection: "row", gap: 2 },
  img2Wrap: { flex: 1, height: IMG_HEIGHT },
  imgFill: { width: "100%", height: "100%" },
  img3Left: { flex: 1, height: IMG_HEIGHT },
  img3Right: { flex: 1, gap: 2 },
  img3RightCell: { flex: 1 },
  imgGrid2x2: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  img4Cell: { width: "49.5%", height: IMG_GRID, position: "relative" },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: { color: "#fff", fontSize: 26, fontWeight: "700" },

  lightboxBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImg: { width: "100%", height: "80%" },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statsItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  reactionEmojis: { flexDirection: "row", gap: 1 },
  likeIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  statsText: { fontSize: 13, color: "#65676B" },

  divider: { height: 1, backgroundColor: "#E4E6EB", marginHorizontal: 14 },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionLabel: { fontSize: 14, fontWeight: "600", color: "#65676B" },

  // Preview comments
  previewWrap: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 6,
    gap: 6,
  },
  viewAllComments: {
    fontSize: 13,
    color: "#65676B",
    fontWeight: "500",
    marginBottom: 2,
  },
  previewComment: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  previewBubble: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  previewName: { fontSize: 13, fontWeight: "700", color: "#050505" },
  previewText: { fontSize: 13, color: "#050505", lineHeight: 18 },

  // Reaction picker
  pickerStrip: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingHorizontal: 6,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
  },
  pickerItemCircle: {
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  pickerEmojiLarge: { fontSize: 38 },
  pickerActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BRAND,
    marginTop: 3,
  },

  // ReactionsModal
  rmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  rmSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  rmHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rmTitle: { fontSize: 16, fontWeight: "700", color: "#050505" },
  rmTabs: { paddingHorizontal: 12, paddingVertical: 8 },
  rmTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    backgroundColor: "transparent",
  },
  rmTabActive: { backgroundColor: BRAND, borderColor: BRAND },
  rmTabText: { fontSize: 13, color: "#65676B", fontWeight: "600" },
  rmTabTextActive: { color: "#fff" },
  rmDivider: { height: 1, backgroundColor: "#E4E6EB" },
  rmRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  rmName: { flex: 1, fontSize: 14, color: "#050505", fontWeight: "500" },
  rmEmoji: { fontSize: 22 },
  rmEmpty: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    paddingVertical: 24,
  },
});
