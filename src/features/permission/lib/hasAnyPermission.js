export const hasAnyPermission = (permissions, codes) =>
  (codes ?? []).some((code) => (permissions ?? []).includes(code));
