import * as FileSystem from "expo-file-system/legacy";

const safeFileName = (name) => String(name ?? "").replace(/[^\w.\-]+/g, "_") || "file";

// File đính kèm không đổi nội dung theo attachmentId → file đã có trên đĩa thì dùng luôn, kể cả sau khi mở lại app.
// Tải vào file tạm rồi mới đổi tên: tải dở (mất mạng, thoát màn) sẽ không bị nhận nhầm là file hoàn chỉnh.
export const downloadTicketFile = async ({ uri, headers, attachmentId, fileName }) => {
  const target = `${FileSystem.cacheDirectory}ticket-${attachmentId}-${safeFileName(fileName)}`;
  const info = await FileSystem.getInfoAsync(target);
  if (info.exists && info.size > 0) return target;

  const temp = `${target}.part`;
  const result = await FileSystem.downloadAsync(uri, temp, { headers });
  if (result.status !== 200) {
    await FileSystem.deleteAsync(temp, { idempotent: true });
    throw new Error(`HTTP ${result.status}`);
  }
  await FileSystem.moveAsync({ from: temp, to: target });
  return target;
};

// WKWebView không gửi header Authorization khi phát video (các request Range của trình phát) → server trả 401.
// Nên phát bản video đã tải về qua 1 trang HTML cục bộ nằm cạnh file.
export const writeVideoPage = async (videoUri, key) => {
  const pageUri = `${FileSystem.cacheDirectory}ticket-video-${safeFileName(key)}.html`;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;height:100%;background:#000}video{width:100%;height:100%;object-fit:contain}</style></head>
<body><video src="${videoUri}" controls autoplay playsinline></video></body></html>`;
  await FileSystem.writeAsStringAsync(pageUri, html);
  return pageUri;
};
