// src/components/CustomAlertProvider.js
import React, { createContext, useContext, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import useTheme from "../assets/theme/useTheme";
import { COLORS } from "../assets/theme/colors";

const AlertContext = createContext();

export const useCustomAlert = () => useContext(AlertContext);

export const CustomAlertProvider = ({ children }) => {
  const theme = useTheme();
  const [alertData, setAlertData] = useState({
    visible: false,
    title: "",
    message: "",
    type: "confirm", // none | confirm | confirmCancel
    dismissOnTouchOutside: true,
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (title, message, options = {}) => {
    setAlertData({
      visible: true,
      title,
      message,
      type: options.type || "confirm",
      dismissOnTouchOutside:
        options.dismissOnTouchOutside !== undefined
          ? options.dismissOnTouchOutside
          : true,
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
    });
  };

  const hideAlert = () => {
    setAlertData({ ...alertData, visible: false });
  };

  const handleOverlayPress = () => {
    if (alertData.dismissOnTouchOutside) hideAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      <Modal visible={alertData.visible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.container,
                  { backgroundColor: theme.colors.alert },
                ]}
              >
                <View style={{ padding: 8 }}>
                  {alertData.title ? (
                    <Text style={styles.title}>{alertData.title}</Text>
                  ) : null}

                  {alertData.message ? (
                    <Text style={styles.message}>{alertData.message}</Text>
                  ) : null}
                </View>

                {/* Nút confirm + cancel */}
                {alertData.type === "confirmCancel" && (
                  <View style={styles.buttons}>
                    <TouchableOpacity
                      style={[styles.btn, styles.cancel]}
                      onPress={() => {
                        hideAlert();
                        alertData.onCancel && alertData.onCancel();
                      }}
                    >
                      <Text style={styles.btnText}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.btn,
                        { backgroundColor: COLORS.Primary },
                      ]}
                      onPress={() => {
                        hideAlert();
                        alertData.onConfirm && alertData.onConfirm();
                      }}
                    >
                      <Text style={styles.btnText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Chỉ có nút confirm */}
                {alertData.type === "confirm" && (
                  <View style={styles.buttons}>
                    <TouchableOpacity
                      style={[
                        styles.btn,
                        { backgroundColor: COLORS.Primary },
                        { alignSelf: "flex-end" },
                      ]}
                      onPress={() => {
                        hideAlert();
                        alertData.onConfirm && alertData.onConfirm();
                      }}
                    >
                      <Text style={styles.btnText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* none: không có nút */}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    padding: 14,
    borderRadius: 40,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  message: { fontSize: 15, marginBottom: 20 },
  buttons: { flexDirection: "row", justifyContent: "center" },
  btn: {
    flex: 1,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    padding: 13,
  },
  cancel: { backgroundColor: "#ccc", marginRight: 8 },
  btnText: { color: "#fff", fontWeight: "600" },
});
