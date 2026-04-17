import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function initDeepLink(navigationRef) {
    const handleUrl = async ({ url }) => {
        const parsed = Linking.parse(url);
        console.log("DEEPLINK:", parsed);

        const ref = parsed.queryParams?.ref;

        const tryNavigate = () => {
            if (navigationRef.isReady()) {
                navigationRef.navigate("Settings", { ref });
            } else {
                setTimeout(tryNavigate, 300);
            }
        };

        tryNavigate();
    };

    Linking.addEventListener("url", handleUrl);

    Linking.getInitialURL().then((url) => {
        if (url) handleUrl({ url });
    });
}