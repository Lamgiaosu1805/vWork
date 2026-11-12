import { useCallback, useEffect } from "react";
import { Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useSegments } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../assets/theme/colors";
import useCanUseHandbook from "../hooks/useCanUseHandbook";
import useVinnyFloating from "../hooks/useVinnyFloating";
import useVinnyPosition from "../hooks/useVinnyPosition";

const FULL_RATIO = 243 / 337;
const GAP = 12;
// Nút AI của CRM nằm ở bottom 90 (cao 52) — VINNY không được xuống thấp hơn để khỏi đè nhau.
const CRM_BOTTOM = 90 + 52 + GAP;
// Chừa chỗ cho header của màn (không cho kéo đè lên nút menu / tiêu đề).
const HEADER_SPACE = 64;
const SPRING = { damping: 18, stiffness: 180, mass: 0.8 };

// Thanh tab chung (CustomBottomTab): iOS cao cố định ~86, Android cộng thêm vùng điều hướng hệ thống.
const tabBarHeight = (insetBottom) =>
  Platform.OS === "android" ? 61 + Math.max(insetBottom + 8, 16) : 86;

const openAssistant = () => router.push("/handbook-assistant");

const MODULE_ROOTS = ["workplace", "hrm", "crm"];
// Màn có thanh tab: segment chứa "(tabs)", hoặc đang ở gốc module — Expo Router bỏ "(tabs)" khỏi segment khi
// module đang ở tab mặc định (vd. ["(drawer)", "crm"]). Màn con (chat-room, customer-detail…) luôn dài hơn.
const isTabScreen = (segments) =>
  segments.includes("(tabs)") ||
  (segments.length === 2 && segments[0] === "(drawer)" && MODULE_ROOTS.includes(segments[1]));

// VINNY nổi, kéo thả được (thả ra thì bám cạnh trái/phải gần nhất, nhớ vị trí theo tài khoản). Chỉ hiện ở màn
// có thanh tab: màn con có ô nhập (chat, tạo đơn…) thì nó sẽ che.
const VinnyFloatingButton = () => {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const hasUnread = useSelector((state) => state.handbookAssistant.hasUnreadAnswer);
  const isStreaming = useSelector((state) => Boolean(state.handbookAssistant.streaming));
  const { canUse } = useCanUseHandbook();
  const { hidden, setHidden } = useVinnyFloating();
  const { position, savePosition } = useVinnyPosition();

  const imgH = Math.round(Math.min(88, Math.max(64, screenW * 0.2)));
  const imgW = Math.round(imgH * FULL_RATIO);
  const minBottom = segments.includes("crm") ? CRM_BOTTOM : tabBarHeight(insets.bottom) + GAP;
  const maxBottom = Math.max(minBottom, screenH - insets.top - HEADER_SPACE - imgH);
  const bottom = Math.min(maxBottom, Math.max(minBottom, position.bottom ?? minBottom));
  const targetX = position.side === "left" ? GAP : screenW - imgW - GAP;
  const targetY = screenH - bottom - imgH;

  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragging = useSharedValue(false);

  // Đổi màn (vd. vào CRM), xoay/đổi cỡ màn hoặc nạp xong vị trí đã lưu → trượt về chỗ hợp lệ.
  useEffect(() => {
    if (dragging.value) return;
    x.value = withSpring(targetX, SPRING);
    y.value = withSpring(targetY, SPRING);
  }, [dragging, targetX, targetY, x, y]);

  const persist = useCallback(
    (side, nextBottom) => savePosition({ side, bottom: nextBottom }),
    [savePosition],
  );

  const pan = Gesture.Pan()
    .minDistance(6)
    .onStart(() => {
      dragging.value = true;
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((e) => {
      x.value = startX.value + e.translationX;
      y.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      const side = x.value + imgW / 2 < screenW / 2 ? "left" : "right";
      const nextBottom = Math.min(maxBottom, Math.max(minBottom, screenH - (y.value + imgH)));
      x.value = withSpring(side === "left" ? GAP : screenW - imgW - GAP, SPRING);
      y.value = withSpring(screenH - nextBottom - imgH, SPRING);
      dragging.value = false;
      runOnJS(persist)(side, Math.round(nextBottom));
    })
    .onFinalize(() => {
      dragging.value = false;
    });

  const tap = Gesture.Tap()
    .maxDuration(400)
    .onEnd(() => {
      runOnJS(openAssistant)();
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: withSpring(dragging.value ? 1.08 : 1, SPRING) },
    ],
  }));

  if (!accessToken || !canUse || hidden !== false || !isTabScreen(segments)) return null;

  const hide = () => {
    setHidden(true);
    Toast.show({
      type: "info",
      text1: "Đã ẩn VINNY",
      text2: "Mở lại trợ lý trong menu ☰ → Tiện ích → VINNY - Trợ lý Nội quy",
    });
  };

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, animatedStyle]}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={isStreaming ? "VINNY đang trả lời, mở trợ lý" : "Mở VINNY - Trợ lý Nội quy"}
          accessibilityHint="Chạm để mở, giữ và kéo để di chuyển"
          onAccessibilityTap={openAssistant}
        >
          <View style={[styles.shadow, { width: imgW * 0.56, left: imgW * 0.22 }]} />
          <Animated.Image
            source={Images.VinnyFull}
            style={{ width: imgW, height: imgH }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          {(hasUnread || isStreaming) && (
            <View style={[styles.badge, isStreaming && !hasUnread && styles.badgeBusy]} />
          )}
        </Animated.View>
      </GestureDetector>
      <TouchableOpacity
        style={styles.close}
        onPress={hide}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Ẩn VINNY"
      >
        <Ionicons name="close" size={11} color={COLORS.white} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, top: 0, zIndex: 1000, elevation: 10 },
  shadow: {
    position: "absolute",
    bottom: 0,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  badge: {
    position: "absolute",
    top: 2,
    left: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ED2E30",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeBusy: { backgroundColor: COLORS.Primary },
  close: {
    position: "absolute",
    top: -4,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(17,24,39,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default VinnyFloatingButton;
