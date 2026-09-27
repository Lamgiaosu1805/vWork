import { Alert, Linking } from "react-native";
import * as Location from "expo-location";
import WifiManager from "react-native-wifi-reborn";
import { ensureLocationPermission } from "../../../helpers/location";

export const resolveLocationPayload = async () => {
  const granted = await ensureLocationPermission();
  if (!granted) throw new Error("LOCATION_PERMISSION_DENIED");

  const ssid = await WifiManager.getCurrentWifiSSID();
  const { coords } = await Location.getCurrentPositionAsync({});

  return { ssid, latitude: coords.latitude, longitude: coords.longitude };
};

export const showLocationPermissionAlert = () =>
  Alert.alert(
    "Quyền vị trí bị tắt",
    "Ứng dụng cần quyền truy cập vị trí để lấy vị trí hiện tại và tên Wi-Fi. Mở cài đặt để bật lại?",
    [
      { text: "Huỷ", style: "cancel" },
      { text: "Mở Cài đặt", onPress: () => Linking.openSettings() },
    ],
  );
