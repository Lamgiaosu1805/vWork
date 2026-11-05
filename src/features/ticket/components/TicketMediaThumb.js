import React, { memo, useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getVideoThumbnail } from "../lib/videoThumbnail";

// Co ảnh vào khung tối đa nhưng giữ đúng tỉ lệ gốc (ảnh dọc hiện dọc, ảnh ngang hiện ngang)
const fit = (size, maxWidth, maxHeight, allowUpscale = false) => {
  if (!size?.width || !size?.height) return null;
  const scale = Math.min(maxWidth / size.width, maxHeight / size.height, allowUpscale ? Infinity : 1);
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
};

// Kích thước ảnh đã đo trong phiên: mở lại màn trao đổi / chi tiết thì có khung đúng ngay, không đo lại (không nhảy layout)
const sizeCache = new Map();

const useImageSize = (source, knownSize) => {
  const [size, setSize] = useState(knownSize?.width ? knownSize : (sizeCache.get(source?.uri) ?? null));

  useEffect(() => {
    if (knownSize?.width || !source?.uri || sizeCache.has(source.uri)) return undefined;
    let cancelled = false;
    const done = (width, height) => {
      sizeCache.set(source.uri, { width, height });
      if (!cancelled) setSize({ width, height });
    };
    const fail = () => !cancelled && setSize(null);
    if (source.headers) Image.getSizeWithHeaders(source.uri, source.headers, done, fail);
    else Image.getSize(source.uri, done, fail);
    return () => {
      cancelled = true;
    };
  }, [source?.uri, knownSize?.width]);

  return size;
};

export const AutoSizeImage = memo(({ source, knownSize, maxWidth, maxHeight, onPress, children }) => {
  const size = useImageSize(source, knownSize);
  // Chưa biết kích thước (đang đọc) thì giữ chỗ hình vuông nhỏ để danh sách không nhảy quá nhiều
  const box = fit(size, maxWidth, maxHeight) ?? { width: Math.min(maxWidth, maxHeight), height: Math.min(maxWidth, maxHeight) };

  return (
    <TouchableOpacity activeOpacity={0.85} disabled={!onPress} onPress={onPress}>
      <Image source={source} style={[styles.image, box]} resizeMode="cover" />
      {children}
    </TouchableOpacity>
  );
});

// Video: ảnh khung hình đầu (expo-video-thumbnails, đúng tỉ lệ video) + nút play. Chưa tạo được ảnh (đang tạo,
// hoặc bản app chưa có module native) thì hiện ô tối theo kích thước video nếu biết (knownSize từ ImagePicker),
// không biết mới dùng 16:9.
export const VideoThumb = ({ source, knownSize, maxWidth, maxHeight, onPress, duration }) => {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getVideoThumbnail(source?.uri, source?.headers).then((result) => {
      if (!cancelled) setThumb(result);
    });
    return () => {
      cancelled = true;
    };
  }, [source?.uri]);

  const overlay = (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.play}>
        <Ionicons name="play" size={22} color="#FFFFFF" style={{ marginLeft: 3 }} />
      </View>
      {!!duration && (
        <Text style={styles.duration}>
          {Math.floor(duration / 60000)}:{String(Math.floor((duration % 60000) / 1000)).padStart(2, "0")}
        </Text>
      )}
    </View>
  );

  if (thumb?.uri) {
    return (
      <AutoSizeImage
        source={{ uri: thumb.uri }}
        knownSize={{ width: thumb.width, height: thumb.height }}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        onPress={onPress}
      >
        {overlay}
      </AutoSizeImage>
    );
  }

  const box = fit(knownSize, maxWidth, maxHeight) ??
    fit({ width: 16, height: 9 }, maxWidth, maxHeight, true) ?? { width: maxWidth, height: maxHeight };
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.videoPlaceholder, box]} />
      {overlay}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: { borderRadius: 12, backgroundColor: "#E5E7EB" },
  videoPlaceholder: { borderRadius: 12, backgroundColor: "#1F2937" },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(17,24,39,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  duration: {
    position: "absolute",
    right: 8,
    bottom: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 5,
    borderRadius: 4,
    overflow: "hidden",
  },
});
