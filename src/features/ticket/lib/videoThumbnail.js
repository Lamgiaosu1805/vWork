// expo-video-thumbnails là module native: bản app build trước khi cài thư viện sẽ ném lỗi ngay lúc import →
// nạp có bảo vệ, thiếu module thì trả null để giao diện hiện ô video không có ảnh (vẫn bấm xem được).
let VideoThumbnails = null;
try {
  // eslint-disable-next-line global-require
  VideoThumbnails = require("expo-video-thumbnails");
} catch {
  VideoThumbnails = null;
}

// Mỗi video chỉ tạo ảnh một lần trong phiên (danh sách tin nhắn render lại nhiều lần)
const cache = new Map();

export const getVideoThumbnail = (uri, headers) => {
  if (!VideoThumbnails || !uri) return Promise.resolve(null);
  if (!cache.has(uri)) {
    cache.set(
      uri,
      VideoThumbnails.getThumbnailAsync(uri, { time: 500, quality: 0.6, headers })
        .then((result) => result)
        .catch(() => {
          cache.delete(uri);
          return null;
        }),
    );
  }
  return cache.get(uri);
};
