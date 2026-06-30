import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootStackNavigator } from "./src/navigators/RootStackNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { useDispatch, useSelector } from "react-redux";
import { store } from "./src/redux/store";
import { CustomAlertProvider } from "./src/components/CustomAlertProvider";
import Toast from "react-native-toast-message";
import { initDeepLink } from "./src/helpers/deepLink";
import { navigationRef } from "./src/helpers/navigationRef";
import {
  initNotifications,
  registerNotificationListeners,
} from "./src/utils/notifications/fcmConfig";
import {
  connectChatSocket,
  disconnectChatSocket,
  registerGlobalChatHandlers,
} from "./src/libs/chatSocket";
import { ThemeProvider } from "./src/assets/theme/ThemeProvider";

// export const navigationRef = React.createRef();

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

export default function App() {
  useEffect(() => {
    initDeepLink(navigationRef);
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
            <Provider store={store}>
              <ChatSocketBootstrapper />
              <RootStackNavigator />
              <Toast />
            </Provider>
          </SafeAreaProvider>
        </CustomAlertProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
