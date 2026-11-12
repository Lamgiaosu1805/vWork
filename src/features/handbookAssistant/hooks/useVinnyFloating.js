import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { accountKeyOf, floatingHiddenStorageKey } from "../lib/accountKey";
import { setFloatingHidden } from "../store/handbookAssistantSlice";

// Bật/tắt VINNY nổi ở góc màn hình; nhớ trên máy theo tài khoản (giá trị đầu nạp ở bootstrap).
const useVinnyFloating = () => {
  const dispatch = useDispatch();
  const accountKey = useSelector((state) => accountKeyOf(state.auth.user));
  const hidden = useSelector((state) => state.handbookAssistant.floatingHidden);

  const setHidden = useCallback(
    (value) => {
      dispatch(setFloatingHidden(value));
      if (accountKey) {
        AsyncStorage.setItem(floatingHiddenStorageKey(accountKey), value ? "1" : "0").catch(() => {});
      }
    },
    [accountKey, dispatch],
  );

  return { hidden, setHidden };
};

export default useVinnyFloating;
