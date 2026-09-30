import { Platform, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
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
import { FCM_TOKEN_STORAGE_KEY } from "../../../../utils/notifications/fcmConfig";
import { DialCallModal } from "./DialCallModal";
import { DialPadModal } from "./DialPadModal";
import Toast from "react-native-toast-message";
import {
  parseErrorMessage,
  requestCallPermissions,
  showCallError,
} from "../../../../helpers/omicallHelper";
import { registerOpenDialPad } from "../../../../helpers/omicallDialRef";
import omicallApi from "../../api/omicallApi";

const OmikitCallManager = () => {
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

  useEffect(() => {
    registerOpenDialPad(handleOpenDialModal);
    return () => registerOpenDialPad(null);
  });

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

      const resParsed = typeof result === "string" ? JSON.parse(result) : result;

      if (resParsed.status === 8 || resParsed.status === 407) {
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

        const sipCredentialsRes = await omicallApi.getSipCredentials();
        const sipCredentials = sipCredentialsRes.data.data;

        try {
          const devices = await getOmiDevices();
          const localDeviceId = await getDeviceId();
          const boundSip = findSipNumberByDeviceId(
            devices,
            localDeviceId ?? "",
          );
          const shouldLogout = boundSip !== sipCredentials.sipUser;

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
          userName: sipCredentials.sipUser,
          password: sipCredentials.sipPassword,
          realm: sipCredentials.sipRealm,
          host: "",
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

export default OmikitCallManager;
