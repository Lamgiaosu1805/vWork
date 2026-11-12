import { Image, Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../assets/theme/colors";
import useCanUseHandbook from "../hooks/useCanUseHandbook";
import useVinnyFloating from "../hooks/useVinnyFloating";

const FULL_RATIO = 243 / 337;
const GAP = 12;
// Nút AI của CRM nằm ở bottom 90 (cao 52) — VINNY đứng phía trên để không đè nhau.
const CRM_BOTTOM = 90 + 52 + GAP;

// Thanh tab chung (CustomBottomTab): iOS cao cố định ~86, Android cộng thêm vùng điều hướng hệ thống.
const tabBarHeight = (insetBottom) =>
  Platform.OS === "android" ? 61 + Math.max(insetBottom + 8, 16) : 86;

// VINNY nổi góc phải dưới. Chỉ hiện ở màn có thanh tab: màn con có ô nhập (chat, tạo đơn…) thì nó sẽ che.
const VinnyFloatingButton = () => {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const hasUnread = useSelector((state) => state.handbookAssistant.hasUnreadAnswer);
  const isStreaming = useSelector((state) => Boolean(state.handbookAssistant.streaming));
  const { canUse } = useCanUseHandbook();
  const { hidden, setHidden } = useVinnyFloating();

  if (!accessToken || !canUse || hidden !== false || !segments.includes("(tabs)")) return null;

  const height = Math.round(Math.min(88, Math.max(64, width * 0.2)));
  const imageWidth = Math.round(height * FULL_RATIO);
  const bottom = segments.includes("crm") ? CRM_BOTTOM : tabBarHeight(insets.bottom) + GAP;

  const hide = () => {
    setHidden(true);
    Toast.show({
      type: "info",
      text1: "Đã ẩn VINNY",
      text2: "Mở lại trợ lý trong menu ☰ → VINNY - Trợ lý Nội quy",
    });
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom, right: GAP }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/handbook-assistant")}
        accessibilityRole="button"
        accessibilityLabel={isStreaming ? "VINNY đang trả lời, mở trợ lý" : "Mở VINNY - Trợ lý Nội quy"}
      >
        <View style={[styles.shadow, { width: imageWidth * 0.56, left: imageWidth * 0.22 }]} />
        <Image
          source={Images.VinnyFull}
          style={{ width: imageWidth, height }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        {(hasUnread || isStreaming) && (
          <View style={[styles.badge, isStreaming && !hasUnread && styles.badgeBusy]} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.close}
        onPress={hide}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Ẩn VINNY"
      >
        <Ionicons name="close" size={11} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: "absolute", zIndex: 1000, elevation: 10 },
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
