// Chuẩn hoá dữ liệu REST về cùng dạng với tin nhắn tạo từ socket trong handbookAssistantSlice.

const toId = (x) => {
  const id = x?._id ?? x?.id;
  return id == null ? null : String(id);
};

const toStatus = (m) => {
  if (m.status === "cancelled" || m.errorCode === "CANCELLED") return "cancelled";
  if (m.status === "error" || m.errorCode) return "error";
  return "done";
};

export const normalizeMessage = (m) => {
  if (m.role === "user") {
    return {
      id: toId(m),
      role: "user",
      content: m.content ?? m.text ?? "",
      createdAt: m.createdAt,
    };
  }
  return {
    id: toId(m),
    role: "assistant",
    content: m.content ?? m.text ?? "",
    citations: m.citations ?? [],
    truncated: Boolean(m.truncated),
    status: toStatus(m),
    errorCode: m.errorCode ?? null,
    feedback: m.feedback ?? null,
    createdAt: m.createdAt,
  };
};

// Lịch sử từ REST: gắn câu hỏi của lượt cho tin trả lời để nút "Thử lại" dùng được như tin trên socket.
export const normalizeMessages = (messages = []) => {
  let lastQuestion = null;
  return messages.map((raw) => {
    const m = normalizeMessage(raw);
    if (m.role === "user") lastQuestion = m.content;
    else m.question = lastQuestion;
    return m;
  });
};

export const normalizeConversation = (c) => ({
  id: toId(c),
  title: c.title || "Hội thoại",
  updatedAt: c.updatedAt ?? c.lastMessageAt ?? c.createdAt,
});

export const normalizeSuggestion = (s) =>
  typeof s === "string" ? s : s?.question ?? s?.text ?? "";

// Gộp các citation cùng một điều khoản thành một chip, giữ lại mọi đoạn trích.
export const groupCitations = (citations = []) => {
  const groups = new Map();
  for (const c of citations) {
    const key = `${c.documentCode}#${c.articleIdx}`;
    const g = groups.get(key);
    if (g) {
      if (c.citedText && !g.citedTexts.includes(c.citedText)) g.citedTexts.push(c.citedText);
    } else {
      groups.set(key, {
        key,
        documentCode: c.documentCode,
        documentTitle: c.documentTitle,
        articleIdx: c.articleIdx,
        label: c.label || `${c.documentTitle} – mục ${c.articleIdx}`,
        citedTexts: c.citedText ? [c.citedText] : [],
      });
    }
  }
  return [...groups.values()];
};

// Tách nội dung thành các đoạn thường / đoạn được trích dẫn (so khớp nguyên văn).
// null = không tìm thấy đoạn nào (khi đó màn điều khoản hiện danh sách trích dẫn riêng).
export const splitHighlights = (content, quotes = []) => {
  const ranges = [];
  for (const q of quotes) {
    const needle = q?.trim();
    if (!needle) continue;
    const start = content.indexOf(needle);
    if (start >= 0) ranges.push([start, start + needle.length]);
  }
  if (!ranges.length) return null;

  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0]];
  for (const [s, e] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }

  const parts = [];
  let cursor = 0;
  for (const [s, e] of merged) {
    if (s > cursor) parts.push({ text: content.slice(cursor, s), mark: false });
    parts.push({ text: content.slice(s, e), mark: true });
    cursor = e;
  }
  if (cursor < content.length) parts.push({ text: content.slice(cursor), mark: false });
  return parts;
};

// UUID v4 cho clientId. Server coi clientId là duy nhất MÃI MÃI theo tài khoản (gửi trùng sẽ nhận lại
// câu trả lời cũ) nên không dùng bộ đếm; Hermes không có crypto.randomUUID.
export const uuidV4 = () => {
  const hex = [];
  for (let i = 0; i < 16; i += 1) hex.push(Math.floor(Math.random() * 256));
  hex[6] = (hex[6] & 0x0f) | 0x40;
  hex[8] = (hex[8] & 0x3f) | 0x80;
  const h = hex.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

// Bốc ngẫu nhiên `count` phần tử (xáo Fisher–Yates trên bản sao).
export const pickRandom = (list = [], count) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, count);
};
