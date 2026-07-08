import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import notifyKit, {
  AndroidImportance,
  EventType,
} from "react-native-notify-kit";
import { PermissionsAndroid, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { navigationRef } from "../../helpers/navigationRef";
import {
  registerDeviceTokenApi,
  unregisterDeviceTokenApi,
} from "../../api/notificationApi";

export const FCM_TOKEN_STORAGE_KEY = "FCM_TOKEN";
const DEFAULT_CHANNEL_ID = "default";

export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();

  if (Platform.OS === "android" && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }

  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function registerAppWithFCM() {
  await messaging().registerDeviceForRemoteMessages();
}

export async function createDefaultNotificationChannel() {
  if (Platform.OS !== "android") return DEFAULT_CHANNEL_ID;

  return notifyKit.createChannel({
    id: DEFAULT_CHANNEL_ID,
    name: "Thông báo",
    importance: AndroidImportance.HIGH,
    sound: "default",
  });
}

export async function getFcmToken() {
  try {
    await requestNotificationPermission();
    await registerAppWithFCM();

    const token = await messaging().getToken();
    console.log("token o day", token);
    if (token) {
      await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    }

    return token;
  } catch (error) {
    console.log("getFcmToken error:", error);
    return null;
  }
}

export async function saveNotificationTokenToServer(token) {
  if (!token) return;
  console.log("token", token);
  try {
    const deviceId = await DeviceInfo.getUniqueId();

    await registerDeviceTokenApi({
      fcm_token: token,
      platform: Platform.OS,
      device_id: deviceId,
    });
  } catch (error) {
    console.log(
      "saveNotificationTokenToServer error:",
      error.response?.data || error.message,
    );
  }
}

export async function syncFcmTokenWithServer() {
  const token =
    (await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY)) ||
    (await getFcmToken());
  await saveNotificationTokenToServer(token);
}

export async function unregisterFcmTokenFromServer() {
  const token = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (!token) return;

  try {
    await unregisterDeviceTokenApi({ fcm_token: token });
  } catch (error) {
    console.log(
      "unregisterFcmTokenFromServer error:",
      error.response?.data || error.message,
    );
  }
}

export async function displayNotificationFromRemoteMessage(remoteMessage) {
  const title = remoteMessage?.notification?.title;
  const body = remoteMessage?.notification?.body;

  if (!title || !body) return;
  if (Platform.OS === "android") {
    const channelId = await createDefaultNotificationChannel();

    await notifyKit.displayNotification({
      title,
      body,
      data: remoteMessage?.data,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        sound: "default",
        pressAction: {
          id: "default",
        },
      },
    });
  }
}

function navigateToChatFromRemoteMessage(remoteMessage) {
  const data = remoteMessage?.data ?? {};
  const conversationId = data?.conversationId;

  if (!conversationId || !navigationRef.isReady()) return false;

  navigationRef.navigate("RootDrawer", {
    screen: "WorkPlaceStackNavigator",
    params: {
      screen: "WorkPlaceBottomTab",
      params: {
        screen: "ChatScreen",
      },
    },
  });

  setTimeout(() => {
    navigationRef.navigate("RootDrawer", {
      screen: "WorkPlaceStackNavigator",
      params: {
        screen: "ChatRoomScreen",
        params: { conversationId },
      },
    });
  }, 50);

  return true;
}

export async function initNotifications() {
  await createDefaultNotificationChannel();
  return getFcmToken();
}

export function registerNotificationListeners() {
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          "Notification opened from quit state:",
          JSON.stringify(remoteMessage),
        );
        const tryNavigate = () => {
          if (!navigateToChatFromRemoteMessage(remoteMessage)) {
            setTimeout(tryNavigate, 300);
          }
        };

        tryNavigate();
      }
    });

  const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
    console.log("onMessage Received:", JSON.stringify(remoteMessage));
    if (
      remoteMessage?.notification?.title &&
      remoteMessage?.notification?.body
    ) {
      await displayNotificationFromRemoteMessage(remoteMessage);
    }
  });
  const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(
    async (token) => {
      await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
      await saveNotificationTokenToServer(token);
    },
  );
  const unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(
    (remoteMessage) => {
      console.log(
        "Notification opened from background:",
        JSON.stringify(remoteMessage),
      );

      navigateToChatFromRemoteMessage(remoteMessage);
    },
  );
  const unsubscribeNotifyKitForeground = notifyKit.onForegroundEvent(
    ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log(
          "NotifyKit notification pressed:",
          JSON.stringify(detail.notification),
        );
      }
    },
  );

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnTokenRefresh();
    unsubscribeOnNotificationOpened();
    unsubscribeNotifyKitForeground();
  };
}

export function registerNotificationBackgroundHandlers() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    return remoteMessage;
  });
}
