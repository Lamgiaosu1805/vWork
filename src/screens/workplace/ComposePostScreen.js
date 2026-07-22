import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";

import { canMgr } from "../../helpers/permissions";
import feedApi from "../../api/feedApi";
import { AuthImage } from "../../components/PostCard";

const BRAND = "#ED2E30";
const MAX_IMAGES = 20;

const toExistingImages = (post) => {
  const urls = post?.images ?? [];
  const rawPaths = post?.images_raw ?? [];
  return urls.map((url, i) => ({
    uri: url,
    rawPath: rawPaths[i] ?? url,
    isExisting: true,
  }));
};

export default function ComposePostScreen({ navigation, route }) {
  const user = useSelector((state) => state.auth.user);
  const canManage = canMgr(user, "workplace");

  const editPost = route?.params?.editPost ?? null;
  const isEditMode = !!editPost;

  const [content, setContent] = useState(editPost?.content ?? "");
  const [isAnnouncement, setIsAnnouncement] = useState(
    editPost?.type === "announcement",
  );
  const [images, setImages] = useState(toExistingImages(editPost));
  const [submitting, setSubmitting] = useState(false);

  const totalImageCount = images.length;

  useEffect(() => {
    setContent(editPost?.content ?? "");
    setIsAnnouncement(editPost?.type === "announcement");
    setImages(toExistingImages(editPost));
  }, [editPost?._id]);

  const handlePickImages = async () => {
    const remaining = MAX_IMAGES - totalImageCount;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled) return;

    const picked = result.assets.map((a) => ({
      uri: a.uri,
      name: decodeURIComponent(a.fileName ?? a.uri.split("/").pop()),
      type: a.mimeType ?? "image/jpeg",
      isExisting: false,
    }));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  };

  const handleRemoveImage = (uri) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const canSubmit = content.trim().length > 0 || totalImageCount > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const formData = new FormData();

      const trimmedContent = content.trim();

      if (trimmedContent) {
        formData.append("content", trimmedContent);
      }

      const keptRawPaths = images
        .filter((img) => img.isExisting)
        .map((img) => img.rawPath)
        .filter(Boolean);

      const newImages = images.filter((img) => !img.isExisting);

      newImages.forEach((img) => {
        formData.append("images", {
          uri: img.uri,
          name: img.name,
          type: img.type,
        });
      });

      if (isEditMode) {
        formData.append("keep_images", JSON.stringify(keptRawPaths));
        await feedApi.editPost(editPost._id, formData);
        Toast.show({ type: "success", text1: "Đã cập nhật bài viết" });
      } else {
        formData.append("type", isAnnouncement ? "announcement" : "post");
        await feedApi.createPost(formData);
        Toast.show({ type: "success", text1: "Đăng bài thành công" });
      }

      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: "error",
        text1:
          err?.response?.data?.message ??
          err?.message ??
          (isEditMode ? "Cập nhật bài viết thất bại" : "Đăng bài thất bại"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasChanges = isEditMode
    ? content.trim() !== (editPost?.content ?? "").trim() ||
      images.some((img) => !img.isExisting) ||
      images.filter((img) => img.isExisting).length !==
        (editPost?.images?.length ?? 0)
    : content.trim() || images.length > 0;

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        isEditMode ? "Hủy chỉnh sửa?" : "Hủy đăng bài?",
        "Nội dung bạn đã thay đổi sẽ bị mất.",
        [
          { text: "Tiếp tục chỉnh sửa", style: "cancel" },
          {
            text: "Hủy",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode
            ? "Chỉnh sửa bài viết"
            : isAnnouncement
              ? "Đăng thông báo"
              : "Đăng bài mới"}
        </Text>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!canSubmit || submitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>{isEditMode ? "Lưu" : "Đăng"}</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.body}>
          <TextInput
            style={styles.textInput}
            placeholder="Chia sẻ điều gì đó với mọi người..."
            placeholderTextColor="#9CA3AF"
            multiline
            autoFocus={!isEditMode}
            value={content}
            onChangeText={setContent}
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>

          {canManage && !isEditMode && (
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Đăng dưới dạng thông báo</Text>
                <Text style={styles.toggleSub}>Hiển thị nhãn "Thông báo"</Text>
              </View>
              <Switch
                value={isAnnouncement}
                onValueChange={setIsAnnouncement}
                trackColor={{ true: BRAND }}
                thumbColor="#fff"
              />
            </View>
          )}

          {totalImageCount < MAX_IMAGES && (
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={handlePickImages}
            >
              <Ionicons name="image-outline" size={18} color="#6B7280" />
              <Text style={styles.addImageText}>
                Thêm ảnh ({totalImageCount}/{MAX_IMAGES})
              </Text>
            </TouchableOpacity>
          )}

          {images.length > 0 && (
            <View style={styles.imageGrid}>
              {images.map((img) => (
                <View key={img.uri} style={styles.imageThumb}>
                  <AuthImage filename={img.uri} style={styles.thumbImg} />
                  <TouchableOpacity
                    style={styles.removeImgBtn}
                    onPress={() => handleRemoveImage(img.uri)}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerBtn: { minWidth: 50 },
  cancelText: { fontSize: 15, color: "#6B7280" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  submitBtn: {
    backgroundColor: BRAND,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 50,
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#D1D5DB" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  body: { padding: 16, paddingBottom: 40 },
  textInput: {
    fontSize: 16,
    color: "#111827",
    minHeight: 140,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 12,
  },
  toggleLabel: { fontSize: 14, color: "#111827", fontWeight: "500" },
  toggleSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  addImageText: { fontSize: 13, color: "#6B7280" },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  imageThumb: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  removeImgBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    padding: 2,
  },
});
