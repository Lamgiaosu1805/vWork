import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const Skeleton = ({ width = "100%", height = 14, borderRadius = 8, style }) => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.35, { duration: 700 })), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.base, { width, height, borderRadius }, animatedStyle, style]} />;
};

export const SkeletonCircle = ({ size = 40, style }) => <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;

export const SkeletonRow = ({ children, gap = 8, style }) => <View style={[{ flexDirection: "row", gap }, style]}>{children}</View>;

export default Skeleton;

const styles = StyleSheet.create({
  base: { backgroundColor: "#E2E8F0" },
});
