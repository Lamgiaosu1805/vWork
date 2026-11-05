import React, { useState } from "react";
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ChevronLeft } from "lucide-react-native";
import Pdf from "react-native-pdf";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";
import Header from "../../components/Header";
import { TICKET_PRIMARY } from "../../features/ticket/constants";
import useTicketCachedFile from "../../features/ticket/hooks/useTicketCachedFile";
import useTicketFileSource from "../../features/ticket/hooks/useTicketFileSource";
import { safeDecode } from "../../features/ticket/lib/ticketFormat";

const OFFICE_EXT = /\.(docx?|xlsx?|pptx?)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v)$/i;

// Xem file đính kèm của ticket: file đã gửi (route tải file cần Bearer token nên truyền header thẳng vào nguồn),
// hoặc file vừa chọn trên máy (localUri) để xem trước khi gửi.
// PDF: react-native-pdf (chụm để phóng to). Word / Excel / PowerPoint: WebView của iOS hiển thị trực tiếp;
// WebView Android không đọc được định dạng Office nên chỉ báo mở trên web. Server trả file Office dạng
// "attachment" + octet-stream (WebView sẽ tải về thay vì hiển thị) → tải vào cache đúng đuôi rồi mở bản trên máy.
export default function TicketFileScreen() {
  const { ticketId, attachmentId, localUri, name = "", mimeType = "" } = useLocalSearchParams();
  const sourceOf = useTicketFileSource();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const remote = sourceOf(ticketId, attachmentId);
  const fileName = safeDecode(name);
  const isImage = /^image\//.test(mimeType) || /\.(jpe?g|png|webp|gif|heic)$/i.test(fileName);
  const isPdf = mimeType === "application/pdf" || /\.pdf$/i.test(fileName);
  const isOffice = OFFICE_EXT.test(fileName);
  const isVideo = VIDEO_EXT.test(fileName) || /^video\//.test(mimeType);
  const isWeb = /\.txt$/i.test(fileName) || /^text\//.test(mimeType);
  const webSupported = isWeb || (isOffice && Platform.OS === "ios");
  const needsLocalFile = (isOffice && webSupported) || isVideo;
  const cached = useTicketCachedFile({
    ticketId,
    attachmentId,
    fileName,
    localUri: localUri ? String(localUri) : "",
    isVideo,
    enabled: needsLocalFile,
  });
  const fileUri = localUri ? String(localUri) : cached.data?.fileUri;
  const videoPage = cached.data?.videoPage;
  const source = fileUri ? { uri: fileUri } : remote;

  const done = () => setLoading(false);
  const fail = () => {
    setLoading(false);
    setFailed(true);
  };

  const message = (icon, text) => (
    <View style={styles.center}>
      <Ionicons name={icon} size={44} color="#CBD5E0" />
      <Text style={styles.centerText}>{text}</Text>
    </View>
  );

  const renderBody = () => {
    if (failed || cached.isError) return message("alert-circle-outline", "Không mở được file. Bạn có thể không còn quyền xem file này.");
    if (isImage) {
      return (
        <ScrollView
          style={styles.dark}
          contentContainerStyle={{ flexGrow: 1 }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
        >
          <Image source={source} style={styles.image} resizeMode="contain" onLoadEnd={done} onError={fail} />
        </ScrollView>
      );
    }
    if (isPdf) {
      return (
        <Pdf
          source={{ ...source, cache: true }}
          style={styles.pdf}
          trustAllCerts={false}
          onLoadComplete={done}
          onError={fail}
        />
      );
    }
    if (isVideo) {
      if (!videoPage) return null;
      return (
        <WebView
          source={{ uri: videoPage }}
          style={styles.dark}
          originWhitelist={["*"]}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          allowingReadAccessToURL={FileSystem.cacheDirectory}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          onLoadEnd={done}
          onError={fail}
        />
      );
    }
    if (webSupported) {
      if (isOffice && !fileUri) return null;
      return (
        <WebView
          source={source}
          style={styles.web}
          originWhitelist={["*"]}
          allowFileAccess
          allowingReadAccessToURL={fileUri ?? undefined}
          allowsInlineMediaPlayback
          onLoadEnd={done}
          onError={fail}
          onHttpError={fail}
        />
      );
    }
    return message(
      "document-outline",
      isOffice
        ? "Android chưa xem trực tiếp được file Word / Excel / PowerPoint. Vui lòng mở ticket trên web để tải về."
        : "Định dạng này chưa xem trực tiếp được trên app. Vui lòng mở ticket trên web để tải về.",
    );
  };

  const showSpinner = loading && !failed && !cached.isError && (isImage || isPdf || webSupported || isVideo);

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <Header title={fileName || "Tệp đính kèm"} LeftIcon={ChevronLeft} onLeftPress={() => router.back()} />
      <View style={{ flex: 1 }}>
        {renderBody()}
        {showSpinner && (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator color={TICKET_PRIMARY} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F9" },
  dark: { flex: 1, backgroundColor: "#111827" },
  image: { flex: 1, width: "100%", minHeight: 400 },
  pdf: { flex: 1, backgroundColor: "#F4F6F9" },
  web: { flex: 1, backgroundColor: "#FFFFFF" },
  spinner: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerText: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
});
