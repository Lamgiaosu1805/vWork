// So sánh "1.2.10" với "1.2.9" theo từng phần số; thiếu phần coi là 0 ("1.2" == "1.2.0")
export const compareVersions = (a, b) => {
  const left = String(a).split(".").map(Number);
  const right = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
};
