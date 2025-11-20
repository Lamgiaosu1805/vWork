import { useEffect } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { navigationRef } from "../helpers/navigationRef";

export default function useDailyAppRestart() {

    const checkNewDay = async () => {
        const today = dayjs().format("YYYY-MM-DD");
        const lastOpen = await AsyncStorage.getItem("LAST_OPEN_DATE");

        // Lần đầu mở app -> gán vào
        if (!lastOpen) {
            await AsyncStorage.setItem("LAST_OPEN_DATE", today);
            return;
        }

        // Ngày mới -> reset về SplashScreen
        if (lastOpen !== today) {
            await AsyncStorage.setItem("LAST_OPEN_DATE", today);

            if (navigationRef.isReady()) {
                navigationRef.reset({
                    index: 0,
                    routes: [{ name: "SplashScreen" }],
                });
            }
        }
    };

    // Kiểm tra khi app active
    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                checkNewDay();
            }
        });

        return () => sub.remove();
    }, []);
}
