import { useQuery } from "@tanstack/react-query";
import appUpdateApi from "../api/appUpdateApi";
import { APP_PLATFORM, APP_VERSION } from "../lib/appVersion";

// Kiểm tra lúc mở app và mỗi lần app quay lại từ nền (focusManager nối AppState ở root layout)
const useAppRelease = () =>
  useQuery({
    queryKey: ["app-release", APP_PLATFORM, APP_VERSION],
    queryFn: async () => {
      const res = await appUpdateApi.getRelease({ platform: APP_PLATFORM, version: APP_VERSION });
      return res.data?.data ?? null;
    },
    enabled: Boolean(APP_PLATFORM && APP_VERSION),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: "always",
    retry: 1,
  });

export default useAppRelease;
