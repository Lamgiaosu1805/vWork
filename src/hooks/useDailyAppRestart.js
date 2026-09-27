import { useEffect } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { router } from "expo-router";

export default function useDailyAppRestart() {
  const checkNewDay = async () => {
    const today = dayjs().format("YYYY-MM-DD");
    const lastOpen = await AsyncStorage.getItem("LAST_OPEN_DATE");

    if (!lastOpen) {
      await AsyncStorage.setItem("LAST_OPEN_DATE", today);
      return;
    }

    if (lastOpen !== today) {
      await AsyncStorage.setItem("LAST_OPEN_DATE", today);
      router.replace("/");
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkNewDay();
      }
    });

    return () => sub.remove();
  }, []);
}
