import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { TICKET_ALLOWED_EXTENSIONS, TICKET_MAX_FILE_MB } from "../constants";
import { safeDecode } from "./ticketFormat";

const extOf = (name = "") => String(name).split(".").pop()?.toLowerCase() ?? "";

const MIME_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  mp4: "video/mp4",
  mov: "video/quicktime",
  pdf: "application/pdf",
};

// Backend chỉ nhận một số đuôi file và tối đa 25MB/file — chặn ngay lúc chọn để không gửi lên rồi mới lỗi
const accept = (files) => {
  const ok = [];
  files.forEach((file) => {
    if (!TICKET_ALLOWED_EXTENSIONS.includes(extOf(file.name))) {
      Toast.show({ type: "error", text1: `Không đính kèm được file .${extOf(file.name) || "?"}` });
      return;
    }
    if (file.size && file.size > TICKET_MAX_FILE_MB * 1024 * 1024) {
      Toast.show({ type: "error", text1: `${file.name} lớn hơn ${TICKET_MAX_FILE_MB}MB` });
      return;
    }
    ok.push(file);
  });
  return ok;
};

export const pickTicketImages = async ({ kind = "screenshot", multiple = true } = {}) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== "granted") {
    Toast.show({ type: "error", text1: "Cần cấp quyền truy cập ảnh để đính kèm" });
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsMultipleSelection: multiple,
    quality: 0.8,
  });
  if (result.canceled) return [];
  return accept(
    result.assets.map((asset) => {
      const name = safeDecode(asset.fileName ?? asset.uri.split("/").pop());
      return {
        uri: asset.uri,
        name,
        size: asset.fileSize ?? null,
        mimeType: asset.mimeType ?? MIME_BY_EXT[extOf(name)] ?? "application/octet-stream",
        width: asset.width,
        height: asset.height,
        duration: asset.duration ?? null,
        kind,
      };
    }),
  );
};

export const pickTicketDocuments = async ({ kind = "other", multiple = true } = {}) => {
  const result = await DocumentPicker.getDocumentAsync({
    multiple,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  return accept(
    result.assets.map((asset) => {
      const name = safeDecode(asset.name ?? asset.uri.split("/").pop());
      return {
        uri: asset.uri,
        name,
        size: asset.size ?? null,
        mimeType: asset.mimeType ?? MIME_BY_EXT[extOf(name)] ?? "application/octet-stream",
        kind,
      };
    }),
  );
};
