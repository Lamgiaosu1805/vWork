import * as Linking from "expo-linking";
import { router } from "expo-router";

export function initDeepLink() {
  const handleUrl = ({ url }) => {
    const parsed = Linking.parse(url);
    const ref = parsed.queryParams?.ma_nv;
    router.push({ pathname: "/settings", params: { ref } });
  };

  Linking.addEventListener("url", handleUrl);

  Linking.getInitialURL().then((url) => {
    if (url) handleUrl({ url });
  });
}
