import { useCallback } from "react";
import { useDispatch } from "react-redux";
import chatApi from "../api/chat";
import Toast from "react-native-toast-message";
import { setConversations, setLoadingConversations } from "../../../redux/slice/chatSlice";

const useConversations = () => {
  const dispatch = useDispatch();

  const loadConversations = useCallback(async () => {
    dispatch(setLoadingConversations(true));
    try {
      const res = await chatApi.getConversations();
      const items = res?.data?.data ?? res?.data ?? [];
      dispatch(setConversations(items));
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error?.response?.data?.message ?? error?.message ?? "Không thể tải danh sách chat",
      });
    } finally {
      dispatch(setLoadingConversations(false));
    }
  }, [dispatch]);

  return { loadConversations };
};

export default useConversations;
