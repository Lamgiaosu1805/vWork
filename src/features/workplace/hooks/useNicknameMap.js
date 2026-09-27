import { useMemo } from "react";

export function useNicknameMap(conversation) {
  return useMemo(() => {
    const map = new Map();
    (conversation?.nicknames || []).forEach((entry) => {
      map.set(String(entry.userId), entry.nickname);
    });
    return map;
  }, [conversation?.nicknames]);
}

export function resolveDisplayName(nicknameMap, userId, fallbackName) {
  return nicknameMap?.get(String(userId)) || fallbackName;
}