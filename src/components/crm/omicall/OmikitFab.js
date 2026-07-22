import { StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { PhoneCall } from "lucide-react-native";
import {
  startServices,
  initCallWithUserPassword,
  OmiCallState,
  startCall,
  getOmiDevices,
  getDeviceId,
  findSipNumberByDeviceId,
  logoutAndWait,
} from "omikit-plugin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FCM_TOKEN_STORAGE_KEY } from "../../../utils/notifications/fcmConfig";
import { DialCallModal } from "./DialCallModal";
import { DialPadModal } from "./DialPadModal";
import Toast from "react-native-toast-message";
import {
  parseErrorMessage,
  requestCallPermissions,
  showCallError,
} from "../../../helpers/omicallHelper";

const SIP_CREDENTIALS = {
  userName: "100",
  password: "sKVksmu29i",
  realm: "lamnk2",
  host: "",
};

const OmikitFab = () => {
  const [isReady, setIsReady] = useState(false);
  const initOnce = useRef(false);

  const [isDialModalVisible, setIsDialModalVisible] = useState(false);

  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [callStatus, setCallStatus] = useState(OmiCallState.calling);
  const [callerNumber, setCallerNumber] = useState(null);

  const handleOpenDialModal = () => {
    if (!isReady) {
      Toast.show({
        type: "error",
        text1: "Omikit chưa sẵn sàng",
      });
      return;
    }
    setIsDialModalVisible(true);
  };

  const handleCloseDialModal = () => {
    setIsDialModalVisible(false);
  };

  const handleCall = async (phoneNumber) => {
    try {
      const result = await startCall({
        phoneNumber,
        isVideo: false,
      });
      console.log("[OMIKIT] startCall result:", result);

      const resParsed = JSON.parse(result);

      if (resParsed.status === 8) {
        console.log("[OMIKIT] Call started, ID:", resParsed._id);
        setCallerNumber(phoneNumber);
        setCallStatus(OmiCallState.calling);
        setIsDialModalVisible(false);
        setIsCallModalVisible(true);
      } else {
        console.log(
          "[OMIKIT] Start call thất bại:",
          resParsed.message,
          resParsed.message_detail,
        );

        showCallError(
          resParsed.status,
          resParsed.message_detail || resParsed.message,
        );
      }
    } catch (error) {
      console.error("[OMIKIT] Lỗi startCall:", error);
      const match = error?.message?.match(/Status:\s*(\d+)/);

      if (match) {
        showCallError(Number(match[1]));
      } else {
        Toast.show({
          type: "error",
          text1: "Không thể gọi",
          text2: error?.message || "Lỗi không xác định",
        });
      }
    }
  };

  const handleCloseCallModal = () => {
    setIsCallModalVisible(false);
  };

  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    console.log("[OMIKIT] Platform:", Platform.OS, Platform.Version);

    const init = async () => {
      try {
        const granted = await requestCallPermissions();
        if (!granted) {
          console.warn("[OMIKIT] Thiếu quyền micro, không thể gọi được");
        }

        await startServices();

        try {
          const devices = await getOmiDevices();
          const localDeviceId = await getDeviceId();
          const boundSip = findSipNumberByDeviceId(
            devices,
            localDeviceId ?? "",
          );
          const shouldLogout = boundSip !== SIP_CREDENTIALS.userName;

          console.log(
            "[OMIKIT] preflight devices:",
            devices.length,
            "boundSip:",
            boundSip,
          );

          if (shouldLogout) {
            const ok = await logoutAndWait();
            console.log("[OMIKIT] logoutAndWait done, success:", ok);
          }
        } catch (e) {
          console.log("[OMIKIT] Preflight lỗi (bỏ qua):", e);
        }

        const fcmToken = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
        console.log("[OMIKIT] FCM token for Omikit:", fcmToken);
        const result = await initCallWithUserPassword({
          userName: SIP_CREDENTIALS.userName,
          password: SIP_CREDENTIALS.password,
          realm: SIP_CREDENTIALS.realm,
          host: SIP_CREDENTIALS.host,
          isVideo: false,
          fcmToken: fcmToken,
          projectId: "",
        });

        console.log("[OMIKIT] Login result:", result);
        setIsReady(!!result);

        if (!result) {
          Alert.alert("Đăng nhập thất bại", "Không thể khởi tạo dịch vụ gọi.");
        }
      } catch (error) {
        console.error("[OMIKIT] Lỗi login:", error);
        Alert.alert("Lỗi đăng nhập Omikit", parseErrorMessage(error));
      }
    };
    init();
  }, []);

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleOpenDialModal}
      >
        <PhoneCall size={22} color="#fff" />
      </TouchableOpacity>

      <DialPadModal
        visible={isDialModalVisible}
        onClose={handleCloseDialModal}
        onCall={handleCall}
      />

      <DialCallModal
        visible={isCallModalVisible}
        status={callStatus}
        callerNumber={callerNumber}
        onClose={handleCloseCallModal}
      />
    </>
  );
};

export default OmikitFab;

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 155,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0055ba",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0055ba",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
});
