import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

import chatApi from "../../../../api/chat";
import { AuthAvatar } from "../../../PostCard";

const NUM_COLUMNS = 3;
const SPACING = 8;
const HORIZONTAL_PADDING = 32;

const ITEM_SIZE =
  (Dimensions.get("window").width -
    HORIZONTAL_PADDING -
    SPACING * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

function MediaItem({
  item,
  index,
  images,
  conversationId,
  navigation,
  accessToken,
}) {
  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate("ImageViewerScreen", {
          images,
          index,
        })
      }
    >
      <Image
        source={{
          uri: chatApi.getImageUrl(conversationId, item._id),
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }}
        style={styles.image}
      />

      <View style={styles.senderAvatar}>
        <AuthAvatar
          filename={item.senderId.avatar}
          name={item.senderId.full_name}
          size={26}
          cacheKey={item.createdAt}
        />
      </View>
    </TouchableOpacity>
  );
}

const MediaSection = ({
  conversationId,
  navigation,
  loading,
  loadingMore,
  images,
  hasNext,
  onLoadMore,
}) => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!images.length) {
    return <Text style={styles.emptyText}>Chưa có file nào được chia sẻ</Text>;
  }
console.log(JSON.stringify(images, null, 2));

  return (
    <>
      <View style={styles.grid}>
        {images.map((item, index) => (
          <MediaItem
            key={item._id + index.toString()}
            item={item}
            index={index}
            images={images}
            conversationId={conversationId}
            navigation={navigation}
            accessToken={accessToken}
          />
        ))}
      </View>

      {hasNext && (
        <TouchableOpacity
          style={styles.loadMore}
          disabled={loadingMore}
          activeOpacity={0.8}
          onPress={onLoadMore}
        >
          {loadingMore ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.loadMoreText}>Xem thêm</Text>
          )}
        </TouchableOpacity>
      )}
    </>
  );
};

export default React.memo(MediaSection);

const styles = StyleSheet.create({
  center: {
    paddingVertical: 20,
    alignItems: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACING,
  },

  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ECECEC",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  senderAvatar: {
    position: "absolute",
    right: 6,
    bottom: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFF",
  },

  loadMore: {
    alignItems: "center",
    paddingVertical: 18,
  },

  loadMoreText: {
    fontWeight: "600",
    color: "#0F766E",
    fontSize: 14,
  },

  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    paddingVertical: 4,
  },
});
