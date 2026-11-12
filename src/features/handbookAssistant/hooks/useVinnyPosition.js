import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { accountKeyOf, floatingPositionStorageKey } from "../lib/accountKey";

// Vị trí VINNY nổi sau khi kéo thả: bám cạnh trái/phải + khoảng cách tới đáy màn hình (lưu theo khoảng cách
// đáy để đổi máy/xoay màn vẫn hợp lý). bottom null = vị trí mặc định ngay trên thanh tab.
const DEFAULT_POSITION = { side: "right", bottom: null };

const useVinnyPosition = () => {
  const accountKey = useSelector((state) => accountKeyOf(state.auth.user));
  const [position, setPosition] = useState(DEFAULT_POSITION);

  useEffect(() => {
    if (!accountKey) return undefined;
    let alive = true;
    AsyncStorage.getItem(floatingPositionStorageKey(accountKey))
      .then((raw) => {
        const saved = raw ? JSON.parse(raw) : null;
        if (alive && saved && (saved.side === "left" || saved.side === "right")) {
          setPosition({ side: saved.side, bottom: Number.isFinite(saved.bottom) ? saved.bottom : null });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [accountKey]);

  const savePosition = useCallback(
    (next) => {
      setPosition(next);
      if (accountKey) {
        AsyncStorage.setItem(floatingPositionStorageKey(accountKey), JSON.stringify(next)).catch(() => {});
      }
    },
    [accountKey],
  );

  return { position, savePosition };
};

export default useVinnyPosition;
