import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import ImageView from "react-native-image-viewing";

import { buildImageUri } from "../../../utils/imageUtils";

const { width } = Dimensions.get("window");

export default function EkycImagesCard({ detail, accessToken }) {
  const [visible, setVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const images = [
    { path: detail?.frontImgPath, label: "Mặt trước" },
    { path: detail?.backImgPath, label: "Mặt sau" },
    { path: detail?.portraitPath, label: "Chân dung" },
  ].filter((i) => !!i.path);

  const imageViewerData = images.map((img) => ({
    uri: buildImageUri(img.path),
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }));

  if (!detail?.frontImgPath) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hình ảnh định danh</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {images.map((img, index) => (
            <Pressable
              key={img.path}
              onPress={() => {
                setImageIndex(index);
                setVisible(true);
              }}
            >
              <Image
                source={{
                  uri: buildImageUri(img.path),
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }}
                style={styles.image}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ImageView
        images={imageViewerData}
        imageIndex={imageIndex}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  image: {
    width: (width - 80) / 3,
    height: 160,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
});
