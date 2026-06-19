import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { AuthAvatar } from "../../PostCard";
import { Ionicons } from "@expo/vector-icons";

const renderAvatarCell = (avatar) => {
  if (!avatar) return null;

  if (avatar.filename) {
    return (
      <AuthAvatar
        filename={avatar.filename}
        name={avatar.name}
        cacheKey={avatar.cacheKey}
        isFlex
      />
    );
  }

  return (
    <View style={styles.groupAvatarFallback}>
      <Ionicons name="person" size={12} color="#fff" />
    </View>
  );
};

const AvatarGroup = ({ count, groupAvatars, width = 46, height = 46 }) => {
  return (
    <View
      style={[
        styles.groupAvatarWrap,
        { width: width, height: height, borderRadius: width / 2 },
      ]}
    >
      {count === 1 && (
        <View style={styles.fullCell}>{renderAvatarCell(groupAvatars[0])}</View>
      )}

      {count === 2 && (
        <>
          <View style={styles.halfCell}>
            {renderAvatarCell(groupAvatars[0])}
          </View>
          <View style={styles.halfCell}>
            {renderAvatarCell(groupAvatars[1])}
          </View>
        </>
      )}

      {count === 3 && (
        <>
          <View style={styles.largeCell}>
            {renderAvatarCell(groupAvatars[0])}
          </View>
          <View style={styles.stackCell}>
            <View style={styles.stackHalf}>
              {renderAvatarCell(groupAvatars[1])}
            </View>
            <View style={styles.stackHalf}>
              {renderAvatarCell(groupAvatars[2])}
            </View>
          </View>
        </>
      )}

      {count >= 4 && (
        <>
          {groupAvatars.slice(0, 4).map((avatar) => (
            <View key={avatar.id} style={styles.quarterCell}>
              {renderAvatarCell(avatar)}
            </View>
          ))}
        </>
      )}
    </View>
  );
};

export default AvatarGroup;

const styles = StyleSheet.create({
  groupAvatarWrap: {
    marginRight: 12,

    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fullCell: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  halfCell: {
    width: "50%",
    height: "100%",
    overflow: "hidden",
  },
  largeCell: {
    width: "50%",
    height: "100%",
    overflow: "hidden",
  },
  stackCell: {
    width: "50%",
    height: "100%",
  },
  stackHalf: {
    width: "100%",
    height: "50%",
    overflow: "hidden",
  },
  quarterCell: {
    width: "50%",
    height: "50%",
    overflow: "hidden",
  },
});
