import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { HEIGHT_SHEET } from "../../screens/crm/CustomerScreen";

const BottomSheet = ({
  translateY,
  children,
  backgroundColor = "#FFFFFF",
  onClose = (isGesture) => {},
}) => {
  const startY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .failOffsetX([-12, 12])
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = startY.value + e.translationY;
      translateY.value = Math.max(0, next);
    })
    .onEnd((e) => {
      const shouldClose = translateY.value > 100;

      translateY.value = withTiming(shouldClose ? HEIGHT_SHEET : 0);
      runOnJS(onClose)(true);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateY.value, [0, HEIGHT_SHEET], [0.6, 0]);

    return {
      opacity,
      pointerEvents: translateY.value < HEIGHT_SHEET ? "auto" : "none",
    };
  });

  return (
    <View style={[styles.container]}>
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => onClose(false)}
        />
      </Animated.View>
      <Animated.View style={[styles.sheet, animatedStyle, { backgroundColor }]}>
        <GestureDetector gesture={gesture}>
          <View
            style={{
              width: "100%",
              paddingVertical: 16,
            }}
          >
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        {children}
      </Animated.View>
    </View>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000080",
  },
  sheet: {
    position: "absolute",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    width: "100%",
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#333333",
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 10,
  },
});
