import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "../redux/store";
import { CustomAlertProvider } from "../components/CustomAlertProvider";
import Toast from "react-native-toast-message";
import {
  initNotifications,
  registerNotificationListeners,
} from "../utils/notifications/fcmConfig";
import {
  connectChatSocket,
  disconnectChatSocket,
  registerGlobalChatHandlers,
} from "../libs/chatSocket";
import { ThemeProvider } from "../assets/theme/ThemeProvider";
import useDailyAppRestart from "../hooks/useDailyAppRestart";
import { initDeepLink } from "../helpers/deepLink";
import { ForceUpdateGate } from "../features/appUpdate";
import { HandbookAssistantBootstrapper, VinnyFloatingButton } from "../features/handbookAssistant";

const queryClient = new QueryClient();

// React Native không có sự kiện focus như trình duyệt: TanStack coi app luôn "đang mở" nên refetchInterval vẫn chạy
// khi app nằm nền. Nối với AppState để dừng polling khi ẩn app và tải lại dữ liệu cũ khi mở app lên.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (status) => {
    if (Platform.OS !== "web") handleFocus(status === "active");
  });
  return () => subscription.remove();
});

const ChatSocketBootstrapper = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    registerGlobalChatHandlers(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (accessToken) {
      connectChatSocket(accessToken);
      return;
    }

    disconnectChatSocket();
  }, [accessToken]);

  return null;
};

export default function RootLayout() {
  useDailyAppRestart();

  useEffect(() => {
    initDeepLink();
    initNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = registerNotificationListeners();
    return unsubscribe;
  }, []);

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CustomAlertProvider>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <Provider store={store}>
                <BottomSheetModalProvider>
                  <ChatSocketBootstrapper />
                  <HandbookAssistantBootstrapper />
                  <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
                    <Stack.Screen
                      name="settings"
                      options={{
                        headerShown: true,
                        headerTitle: "Cài đặt",
                        headerTintColor: "#004643",
                        headerStyle: { backgroundColor: "#fff" },
                      }}
                    />
                    <Stack.Screen
                      name="handbook-assistant/article"
                      options={{ presentation: "modal" }}
                    />
                  </Stack>
                  <VinnyFloatingButton />
                  <Toast />
                  <ForceUpdateGate />
                </BottomSheetModalProvider>
              </Provider>
            </QueryClientProvider>
          </SafeAreaProvider>
        </CustomAlertProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
