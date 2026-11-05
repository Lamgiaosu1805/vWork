import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ImageView from "react-native-image-viewing";
import { TICKET_FILE_KIND_LABELS } from "../constants";
import useTicketFileSource from "../hooks/useTicketFileSource";
import { formatFileSize, safeDecode } from "../lib/ticketFormat";
import { AutoSizeImage, VideoThumb } from "./TicketMediaThumb";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic)$/i;

export const isImageFile = (file) =>
  /^image\//.test(file?.mimeType ?? "") || IMAGE_EXT.test(file?.name ?? "");
export const isVideoFile = (file) =>
  /^video\//.test(file?.mimeType ?? "") || /\.(mp4|mov)$/i.test(file?.name ?? "");
const isPdfFile = (file) => file?.mimeType === "application/pdf" || /\.pdf$/i.test(file?.name ?? "");

const FILE_BADGE = [
  { test: (name) => /\.pdf$/i.test(name), label: "PDF", bg: "#FEE2E2", color: "#B91C1C" },
  { test: (name) => /\.docx?$/i.test(name), label: "DOC", bg: "#DBEAFE", color: "#1D4ED8" },
  { test: (name) => /\.xlsx?$/i.test(name), label: "XLS", bg: "#DCFCE7", color: "#15803D" },
  { test: (name) => /\.txt$/i.test(name), label: "TXT", bg: "#F3F4F6", color: "#4B5563" },
  { test: (name) => /\.(mp4|mov)$/i.test(name), label: "VIDEO", bg: "#F5F3FF", color: "#6D28D9" },
];

export const FileBadge = ({ name = "", locked }) => {
  if (locked) {
    return (
      <View style={[styles.badge, { backgroundColor: "#F3F4F6" }]}>
        <Ionicons name="lock-closed" size={16} color="#6B7280" />
      </View>
    );
  }
  const badge = FILE_BADGE.find((item) => item.test(name));
  return (
    <View style={[styles.badge, { backgroundColor: badge?.bg ?? "#F3F4F6" }]}>
      {badge ? (
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
      ) : (
        <Ionicons name="document-outline" size={18} color="#6B7280" />
      )}
    </View>
  );
};

// Mở màn xem file: file đã gửi (ticketId + attachmentId) hoặc file vừa chọn trên máy (localUri) để xem trước khi gửi
export const openTicketFile = ({ ticketId, file, localUri }) =>
  router.push({
    pathname: "/tickets/file",
    params: {
      ticketId: ticketId ?? "",
      attachmentId: file?.id ?? "",
      localUri: localUri ?? "",
      name: file?.name ?? "",
      mimeType: file?.mimeType ?? "",
    },
  });

export const FileRow = ({ file, onPress }) => {
  const name = file.canOpen === false ? null : safeDecode(file.name);
  return (
    <TouchableOpacity
      style={styles.file}
      activeOpacity={0.7}
      disabled={file.canOpen === false}
      onPress={onPress}
    >
      <FileBadge name={name ?? ""} locked={file.canOpen === false} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.fileName} numberOfLines={1}>
          {name ?? TICKET_FILE_KIND_LABELS[file.kind] ?? "Tệp nhạy cảm"}
        </Text>
        <Text style={styles.fileMeta} numberOfLines={1}>
          {[
            file.sensitive ? "Nhạy cảm" : TICKET_FILE_KIND_LABELS[file.kind],
            file.canOpen === false ? "Bạn không có quyền xem" : formatFileSize(file.size),
            file.uploadedBy,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      {file.canOpen !== false && <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />}
    </TouchableOpacity>
  );
};

// File của ticket / tin nhắn: ảnh / video hiện thumbnail giữ đúng tỉ lệ gốc (ảnh bấm để xem toàn màn hình,
// chụm để phóng to; video bấm để phát), file khác hiện thành dòng (bấm để mở màn xem PDF / Word / Excel...).
// Một ảnh thì hiện to tới maxWidth; nhiều ảnh thì mỗi ảnh nhỏ lại cho vừa 2 cột.
const TicketAttachments = ({ ticketId, files = [], maxWidth = 220, align = "flex-start" }) => {
  const sourceOf = useTicketFileSource();
  const [viewerIndex, setViewerIndex] = useState(-1);

  const media = files.filter((file) => file.canOpen !== false && (isImageFile(file) || isVideoFile(file)));
  const images = media.filter((file) => isImageFile(file));
  const others = files.filter((file) => !media.includes(file));
  const imageSources = images.map((file) => sourceOf(ticketId, file.id));
  const single = media.length === 1;
  const boxWidth = single ? maxWidth : Math.floor((maxWidth - 6) / 2);
  const boxHeight = single ? Math.round(maxWidth * 1.3) : Math.round(boxWidth * 1.4);

  if (!files.length) return null;

  return (
    <View style={{ gap: 8, alignItems: align }}>
      {media.length > 0 && (
        <View style={[styles.grid, { justifyContent: align, maxWidth }]}>
          {media.map((file) =>
            isVideoFile(file) ? (
              <VideoThumb
                key={file.id}
                source={sourceOf(ticketId, file.id)}
                maxWidth={boxWidth}
                maxHeight={boxHeight}
                onPress={() => openTicketFile({ ticketId, file })}
              />
            ) : (
              <AutoSizeImage
                key={file.id}
                source={imageSources[images.indexOf(file)]}
                maxWidth={boxWidth}
                maxHeight={boxHeight}
                onPress={() => setViewerIndex(images.indexOf(file))}
              />
            ),
          )}
        </View>
      )}
      {others.map((file) => (
        <View key={file.id} style={{ alignSelf: "stretch" }}>
          <FileRow file={file} onPress={() => openTicketFile({ ticketId, file })} />
        </View>
      ))}
      <ImageView
        images={imageSources}
        imageIndex={Math.max(viewerIndex, 0)}
        visible={viewerIndex >= 0}
        onRequestClose={() => setViewerIndex(-1)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        FooterComponent={({ imageIndex }) => (
          <View style={styles.viewerFooter}>
            <Text style={styles.viewerText} numberOfLines={1}>
              {safeDecode(images[imageIndex]?.name)}
            </Text>
            {images.length > 1 && (
              <Text style={styles.viewerCount}>
                {imageIndex + 1}/{images.length}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

export { isPdfFile };
export default TicketAttachments;

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 6 },
  file: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  badge: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 9, fontWeight: "800" },
  fileName: { fontSize: 13, fontWeight: "600", color: "#1A1D26" },
  fileMeta: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  viewerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  viewerText: { flex: 1, fontSize: 13, color: "#FFFFFF" },
  viewerCount: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});
