import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import {
  endCall,
  getCurrentUser,
  getGuestUser,
  OmiCallEvent,
  OmiCallState,
  toggleSpeaker,
} from "omikit-plugin";

import { KeyboardAvoid } from "./KeyboardAvoid";
import { UIImages } from "../../../assets/UIImages";
import { CustomTimer } from "./CustomTimer";
import { showCallError } from "../../../helpers/omicallHelper";
import { COLORS } from "../../../assets/theme/colors";

export class LiveData {
  static isOpenedCall = false;
}

const STATUS_DESCRIPTIONS = {
  [OmiCallState.calling]: "Đang gọi",
  [OmiCallState.connecting]: "Đang kết nối",
  [OmiCallState.early]: "Đổ chuông",
  [OmiCallState.confirmed]: "Đang gọi",
  [OmiCallState.disconnected]: "Đã kết thúc",
  [OmiCallState.hold]: "Đang giữ",
};

/**
 * DialCallModal (modern redesign)
 *
 * Minimal call UI: shows call status/timer, a Hangup button, and a
 * Speaker on/off toggle. No DTMF keypad, no transfer, no multi-device
 * audio picker, no incoming-call answer flow — outgoing calls only.
 *
 * Props:
 *  - visible: boolean       → controls Modal visibility
 *  - status: number         → initial OmiCallState when opened
 *  - callerNumber?: string
 *  - onClose: () => void    → called when the modal should be dismissed
 */
export const DialCallModal = ({
  visible,
  status: initialStatus,
  callerNumber,
  onClose,
}) => {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isEnding, setIsEnding] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [guestUser, setGuestUser] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setCurrentStatus(initialStatus);
      setIsEnding(false);
    }
  }, [visible, initialStatus]);

  const statusText = useMemo(
    () =>
      isEnding ? "Đang kết thúc..." : STATUS_DESCRIPTIONS[currentStatus] || "",
    [currentStatus, isEnding],
  );

  const isCallActive =
    currentStatus === OmiCallState.confirmed ||
    currentStatus === OmiCallState.hold;

  const isRinging =
    currentStatus === OmiCallState.calling ||
    currentStatus === OmiCallState.connecting ||
    currentStatus === OmiCallState.early;

  useEffect(() => {
    if (isRinging && visible) {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      pulseLoopRef.current?.stop();
    };
  }, [isRinging, visible, pulseAnim]);

  const fetchUserInfo = useCallback(async () => {
    const [current, guest] = await Promise.all([
      getCurrentUser(),
      getGuestUser(),
    ]);
    setCurrentUser(current);
    setGuestUser(guest);
  }, []);

  const handleCallStateChanged = useCallback(
    (data) => {
      const { status } = data;
      console.log("Call state changed:", status);
      setCurrentStatus(status);

      if (status === OmiCallState.disconnected) {
        const code = data.codeEndCall ?? data.code_end_call;

        if (code && code !== 200) {
          showCallError(code);
        }

        setTimeout(() => {
          onClose?.();
        }, 200);
      }
    },
    [onClose],
  );

  const handleSpeakerChanged = useCallback((isOn) => {
    console.log("Speaker state changed:", isOn);
    setIsSpeakerOn(!!isOn);
  }, []);

  const handleToggleSpeaker = useCallback(async () => {
    try {
      const result = await toggleSpeaker();
      setIsSpeakerOn(!!result);
    } catch (error) {
      console.log("Toggle speaker error:", error);
    }
  }, []);

  const handleEndCall = useCallback(() => {
    setIsEnding(true);
    endCall();
    setTimeout(() => {
      onClose?.();
    }, 3000);
  }, [onClose]);

  useEffect(() => {
    if (!visible) return undefined;

    const listeners = [
      DeviceEventEmitter.addListener(
        OmiCallEvent.onCallStateChanged,
        handleCallStateChanged,
      ),
      DeviceEventEmitter.addListener(
        OmiCallEvent.onSpeaker,
        handleSpeakerChanged,
      ),
    ];

    LiveData.isOpenedCall = true;

    return () => {
      listeners.forEach((listener) => listener.remove());
      LiveData.isOpenedCall = false;
    };
  }, [visible, handleCallStateChanged, handleSpeakerChanged]);

  useEffect(() => {
    if (!visible) return undefined;
    const onBackPress = () => true;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    fetchUserInfo();
  }, [visible, fetchUserInfo]);

  const guestName = guestUser?.extension ?? callerNumber ?? "...";

  return (
    <Modal
      visible={!!visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
    >
      <KeyboardAvoid>
        <LinearGradient
          colors={[COLORS.neutral.neutral900, "#0B0F1A"]}
          style={styles.background}
        >
          <View style={styles.selfBubble}>
            {currentUser?.avatar_url ? (
              <Image
                source={{ uri: currentUser.avatar_url }}
                style={styles.selfAvatar}
              />
            ) : (
              <Image source={UIImages.callingFace} style={styles.selfAvatar} />
            )}
            <Text style={styles.selfName} numberOfLines={1}>
              {currentUser?.extension ?? "Bạn"}
            </Text>
          </View>

          <View style={styles.centerBlock}>
            <View style={styles.avatarWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              {guestUser?.avatar_url ? (
                <Image
                  source={{ uri: guestUser.avatar_url }}
                  style={styles.guestAvatar}
                />
              ) : (
                <Image
                  source={UIImages.callingFace}
                  style={styles.guestAvatar}
                />
              )}
            </View>

            <Text style={styles.guestName} numberOfLines={1}>
              {guestName}
            </Text>

            <View style={styles.statusRow}>
              {isRinging && !isEnding && <View style={styles.statusDot} />}
              <Text style={styles.status}>{statusText}</Text>
            </View>

            {isCallActive && (
              <View style={styles.timerWrap}>
                <CustomTimer />
              </View>
            )}
          </View>

          {/* Cụm nút điều khiển */}
          <View style={styles.controlsBlock}>
            <TouchableOpacity
              onPress={handleToggleSpeaker}
              activeOpacity={0.8}
              style={styles.controlColumn}
            >
              <View
                style={[
                  styles.glassButton,
                  isSpeakerOn && styles.glassButtonActive,
                ]}
              >
                <Image
                  source={isSpeakerOn ? UIImages.icSpeaker : UIImages.icIphone}
                  style={styles.controlIcon}
                />
              </View>
              <Text style={styles.controlLabel}>
                {isSpeakerOn ? "Loa ngoài" : "Điện thoại"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEndCall}
              activeOpacity={0.85}
              style={styles.controlColumn}
            >
              <LinearGradient
                colors={COLORS.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hangupButton}
              >
                <Image source={UIImages.hangup} style={styles.hangupIcon} />
              </LinearGradient>
              <Text style={styles.controlLabel}>Kết thúc</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoid>
    </Modal>
  );
};

const AVATAR_SIZE = 140;
const RING_SIZE = AVATAR_SIZE + 36;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
  },

  // PiP self bubble
  selfBubble: {
    position: "absolute",
    top: 60,
    right: 20,
    alignItems: "center",
    width: 64,
  },
  selfAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  selfName: {
    marginTop: 6,
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },

  // Center block
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulseRing: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: COLORS.Primary,
    opacity: 0.18,
  },
  guestAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.15)",
  },
  guestName: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 8,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.Secondary,
    marginRight: 8,
  },
  status: {
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  timerWrap: {
    marginTop: 14,
  },

  // Controls
  controlsBlock: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 48,
  },
  controlColumn: {
    alignItems: "center",
  },
  glassButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  glassButtonActive: {
    backgroundColor: "rgba(241,103,51,0.25)",
    borderColor: COLORS.Primary,
  },
  controlIcon: {
    width: 26,
    height: 26,
    tintColor: COLORS.white,
  },
  hangupButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.Primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  hangupIcon: {
    width: 30,
    height: 30,
  },
  controlLabel: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
});
