import { useQuery } from "@tanstack/react-query";
import profileApi from "../api/profileApi";

const useUserProfile = (userId) =>
  useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const res = await profileApi.getProfile(userId);
      return res.data ?? res;
    },
    enabled: !!userId,
  });

export default useUserProfile;
