import { useCallback } from "react";
import chatApi from "../api/chat";

const useSearchUsers = () => {
  const searchUsers = useCallback(async (search, limit = 20) => {
    const res = await chatApi.searchUsers({ search, limit });
    return res?.data?.data ?? res?.data ?? [];
  }, []);

  return { searchUsers };
};

export default useSearchUsers;
