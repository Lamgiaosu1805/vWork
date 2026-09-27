import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

export default function ConnectionStatusBar({ status }) {
  if (status === "connected") return null;

  const isDisconnected = status === "disconnected";

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.bar,
        { backgroundColor: isDisconnected ? "#5c1f1f" : "#3a3a3a" },
      ]}
    >
      {isDisconnected ? (
        <Text style={styles.icon}>⚠</Text>
      ) : (
        <ActivityIndicator size={12} color="#fff" />
      )}
      <Text style={styles.text}>
        {isDisconnected
          ? "Mất kết nối. Đang thử kết nối lại..."
          : "Đang kết nối..."}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  icon: { fontSize: 12, color: "#fff" },
  text: { fontSize: 12.5, fontWeight: "500", color: "#fff" },
});
