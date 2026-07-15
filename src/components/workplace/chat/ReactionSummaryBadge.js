import { StyleSheet, Text, TouchableOpacity } from "react-native";
import React from "react";

export const REACTIONS = [
  { type: "like", emoji: "👍", label: "Thích", color: "#1877F2" },
  { type: "love", emoji: "❤️", label: "Yêu thích", color: "#ED2E30" },
  { type: "haha", emoji: "😆", label: "Haha", color: "#F7B928" },
  { type: "wow", emoji: "😮", label: "Wow", color: "#F7B928" },
  { type: "sad", emoji: "😢", label: "Buồn", color: "#F7B928" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ", color: "#E9710F" },
];

const REACTION_MAP = REACTIONS.reduce((acc, r) => {
  acc[r.type] = r;
  return acc;
}, {});

const ReactionSummaryBadge = ({ reactions, isMine, onPress, isImage }) => {
  if (!reactions?.length) return null;

  const counts = reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const topTypes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.reactionBadge,
        isMine ? styles.reactionBadgeMine : styles.reactionBadgeOther,
        isImage && { bottom: 8 },
      ]}
    >
      {topTypes.map((t) => (
        <Text key={t} style={styles.reactionBadgeEmoji}>
          {REACTION_MAP[t]?.emoji}
        </Text>
      ))}
      {reactions.length > 1 && (
        <Text style={styles.reactionBadgeCount}>{reactions.length}</Text>
      )}
    </TouchableOpacity>
  );
};

export default ReactionSummaryBadge;

const styles = StyleSheet.create({
  reactionBadge: {
    position: "absolute",
    bottom: -12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  reactionBadgeMine: { left: 0 },
  reactionBadgeOther: { right: 0 },
  reactionBadgeEmoji: { fontSize: 12, marginHorizontal: -1 },
  reactionBadgeCount: { fontSize: 12, color: "#6B7280", marginLeft: 3 },
});
