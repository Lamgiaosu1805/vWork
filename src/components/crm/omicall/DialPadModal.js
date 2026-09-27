// DialPadModal.js
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PhoneCall, Delete } from "lucide-react-native";
import { CustomKeyboard } from "./CustomKeyboard";
import { UIColors } from "../../../assets/colors/UIColors";
import { UIImages } from "../../../assets/UIImages";
import { COLORS } from "../../../assets/theme/colors";

export const DialPadModal = ({ visible, onClose, onCall }) => {
  const [dialedNumber, setDialedNumber] = useState("");

  useEffect(() => {
    if (visible) {
      setDialedNumber("");
    }
  }, [visible]);

  const handlePressDigit = (digit) => {
    setDialedNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handlePressCall = () => {
    const phoneNumber = dialedNumber.trim();
    if (!phoneNumber) return;
    onCall?.(phoneNumber);
  };

  return (
    <Modal
      visible={!!visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.dialOverlay}>
        <View style={styles.dialContainer}>
          <View style={styles.dialHeader}>
            <TouchableOpacity onPress={onClose}>
              <Image source={UIImages.close} style={styles.close} />
            </TouchableOpacity>
          </View>

          <View style={styles.numberDisplayRow}>
            <Text style={styles.numberDisplay} numberOfLines={1}>
              {dialedNumber || "Nhập số điện thoại"}
            </Text>
            {dialedNumber.length > 0 && (
              <TouchableOpacity
                onPress={handleBackspace}
                style={styles.backspaceButton}
              >
                <Delete size={22} color={UIColors?.textColor ?? "#333"} />
              </TouchableOpacity>
            )}
          </View>

          <CustomKeyboard title="" callback={handlePressDigit} />

          <TouchableOpacity
            style={[
              styles.callButton,
              !dialedNumber && styles.callButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handlePressCall}
            disabled={!dialedNumber}
          >
            <PhoneCall size={20} color="#fff" />
            <Text style={styles.callButtonText}>Gọi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dialOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dialContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  dialHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  numberDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    minHeight: 36,
  },
  numberDisplay: {
    flex: 1,
    fontSize: 26,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
  backspaceButton: {
    marginLeft: 12,
    padding: 6,
  },
  callButton: {
    marginTop: 12,
    backgroundColor: COLORS.Primary,
    borderRadius: 28,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  callButtonDisabled: {
    backgroundColor: COLORS.Tertiary,
  },
  callButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  close: {
    width: 24,
    height: 24,
  },
});
