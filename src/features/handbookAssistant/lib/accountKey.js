// Khoá lưu tuỳ chọn theo tài khoản (đồng ý chia sẻ dữ liệu, tắt VINNY nổi) — máy dùng chung nhiều người.
export const accountKeyOf = (user) => {
  const id = user?.id ?? user?._id;
  return id == null ? null : String(id);
};

export const consentStorageKey = (accountKey) => `handbookAssistant:consent:${accountKey}`;
export const floatingHiddenStorageKey = (accountKey) => `handbookAssistant:floatingHidden:${accountKey}`;
