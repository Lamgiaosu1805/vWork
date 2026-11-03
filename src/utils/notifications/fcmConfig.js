import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import notifyKit, {
  AndroidImportance,
  EventType,
} from "react-native-notify-kit";
import { PermissionsAndroid, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { router } from "expo-router";
import {
  registerDeviceTokenApi,
  unregisterDeviceTokenApi,
} from "../../api/notificationApi";
import { queryClient } from "../../libs/queryClient";
// Import thẳng lib (không qua barrel crmCustomerCare) — file này nạp từ index.js gốc/headless handler,
// tránh kéo cả UI CRM (omikit, bottom sheet...) vào lúc khởi động
import {
  isCustomerCarePushType,
  navigateToCareQueue,
} from "../../features/crmCustomerCare/lib/careNavigation";
import { CARE_QUERY_ROOT } from "../../features/crmCustomerCare/lib/queryKeys";

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

  if (!conversationId) return false;

  router.push("/workplace");

  return true;
}

function handleNotificationOpen(remoteMessage) {
  const data = remoteMessage?.data ?? {};
  if (isCustomerCarePushType(data.type)) {
    navigateToCareQueue();
    return true;
  }
  return navigateToChatFromRemoteMessage(remoteMessage);
}

function handleForegroundCustomerCare(remoteMessage) {
  if (!isCustomerCarePushType(remoteMessage?.data?.type)) return;
  // Hiển thị đã có sẵn (iOS: firebase.json foreground_presentation_options, Android: notifyKit) — chỉ cần làm mới hàng đợi
  queryClient.invalidateQueries({ queryKey: [CARE_QUERY_ROOT] });
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
        handleNotificationOpen(remoteMessage);
      }
    });

  const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
    console.log("onMessage Received:", JSON.stringify(remoteMessage));
    handleForegroundCustomerCare(remoteMessage);
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

      handleNotificationOpen(remoteMessage);
    },
  );
  const unsubscribeNotifyKitForeground = notifyKit.onForegroundEvent(
    ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log(
          "NotifyKit notification pressed:",
          JSON.stringify(detail.notification),
        );
        if (isCustomerCarePushType(detail.notification?.data?.type)) {
          navigateToCareQueue();
        }
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
