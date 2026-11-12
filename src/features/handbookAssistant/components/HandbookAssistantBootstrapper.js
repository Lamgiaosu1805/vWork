import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getChatSocket } from "../../../libs/chatSocket";
import { QUERY_KEYS } from "../constants";
import useCanUseHandbook from "../hooks/useCanUseHandbook";
import { accountKeyOf, floatingHiddenStorageKey } from "../lib/accountKey";
import {
  attachStreamListeners,
  resyncStream,
  setTurnFinishedListener,
  stopStreamTimers,
} from "../lib/streamController";
import { resetHandbookAssistant, setFloatingHidden } from "../store/handbookAssistantSlice";

// Mount MỘT lần ở root layout, SAU ChatSocketBootstrapper (để lấy đúng socket vừa tạo cho token mới).
const HandbookAssistantBootstrapper = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const accountKey = useSelector((state) => accountKeyOf(state.auth.user));
  const { canUse } = useCanUseHandbook();
  const enabled = Boolean(accessToken) && canUse;

  // Đăng nhập tài khoản khác → bỏ hội thoại của người trước.
  const lastAccountRef = useRef(accountKey);
  useEffect(() => {
    if (lastAccountRef.current === accountKey) return;
    lastAccountRef.current = accountKey;
    stopStreamTimers();
    dispatch(resetHandbookAssistant());
    queryClient.removeQueries({ queryKey: QUERY_KEYS.all });
  }, [accountKey, dispatch, queryClient]);

  useEffect(() => {
    if (!accountKey) return;
    AsyncStorage.getItem(floatingHiddenStorageKey(accountKey))
      .then((value) => dispatch(setFloatingHidden(value === "1")))
      .catch(() => dispatch(setFloatingHidden(false)));
  }, [accountKey, dispatch]);

  useEffect(() => {
    setTurnFinishedListener(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.quota });
    });
    return () => setTurnFinishedListener(null);
  }, [queryClient]);

  // accessToken trong deps: đổi token thì chatSocket tạo socket mới → gắn lại listener.
  useEffect(() => {
    if (!enabled) return undefined;
    return attachStreamListeners(getChatSocket());
  }, [enabled, accessToken]);

  // Ra nền thì mất delta; về foreground hỏi lại cùng clientId để lấy kết quả (socket chưa nối lại thì
  // handler "connect" sẽ làm việc này).
  useEffect(() => {
    if (!enabled) return undefined;
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") resyncStream();
    });
    return () => subscription.remove();
  }, [enabled]);

  return null;
};

export default HandbookAssistantBootstrapper;
