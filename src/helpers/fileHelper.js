const FILE_TYPE_CONFIG = [
  { test: /pdf$/i, icon: "document-text", color: "#DC2626", label: "PDF" },
  {
    test: /(doc|docx)$/i,
    icon: "document-text",
    color: "#2563EB",
    label: "DOC",
  },
  { test: /(xls|xlsx|csv)$/i, icon: "grid", color: "#16A34A", label: "XLS" },
  { test: /(ppt|pptx)$/i, icon: "easel", color: "#EA580C", label: "PPT" },
  { test: /(zip|rar|7z)$/i, icon: "archive", color: "#7C3AED", label: "ZIP" },
  {
    test: /(mp3|wav|m4a|aac)$/i,
    icon: "musical-notes",
    color: "#0891B2",
    label: "AUDIO",
  },
  {
    test: /(mp4|mov|avi|mkv)$/i,
    icon: "videocam",
    color: "#DB2777",
    label: "VIDEO",
  },
];

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileTypeConfig = (originalName, mimeType) => {
  const key = `${originalName ?? ""} ${mimeType ?? ""}`;
  const found = FILE_TYPE_CONFIG.find((c) => c.test.test(key));
  return found ?? { icon: "document", color: "#6B7280", label: "FILE" };
};

export const getFileExt = (originalName) => {
  const match = /\.([a-zA-Z0-9]+)$/.exec(originalName ?? "");
  return match ? match[1].toUpperCase() : "";
};
