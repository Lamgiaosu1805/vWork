import React from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const MAX_TRANSLATE = 72;
const REPLY_DISTANCE = 52;
const DRAG_FACTOR = 0.65;

export default function SwipeToReplyMessage({
  children,
  message,
  onReply,
  isMine = false,
  translateX,
  style,
}) {
  const pan = Gesture.Pan()
    .minDistance(5)
    .activeOffsetX(isMine ? [-15, 0] : [0, 15])
    .failOffsetY([-12, 12])
    .onUpdate(({ translationX }) => {
      const raw = translationX * DRAG_FACTOR;

      translateX.value = isMine
        ? clamp(raw, -MAX_TRANSLATE, 0)
        : clamp(raw, 0, MAX_TRANSLATE);
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) >= REPLY_DISTANCE) {
        runOnJS(onReply)(message);
      }

      translateX.value = withSpring(0, {
        damping: 18,
        stiffness: 220,
        mass: 0.45,
      });
    });

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateX.value),
      [0, REPLY_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );

    const offset = isMine
      ? interpolate(progress, [0, 1], [12, 0], Extrapolation.CLAMP)
      : interpolate(progress, [0, 1], [-12, 0], Extrapolation.CLAMP);

    return {
      opacity: progress,
      transform: [
        {
          translateX: offset,
        },
        {
          scale: interpolate(progress, [0, 1], [0.75, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, style]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.replyIcon,
            isMine ? styles.replyIconRight : styles.replyIconLeft,
            iconStyle,
          ]}
        >
          <Ionicons name="arrow-undo" size={22} color="#0F766E" />
        </Animated.View>

        <Animated.View style={bubbleStyle}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
  },
  replyIcon: {
    position: "absolute",
    top: "35%",
    zIndex: 1,
  },
  replyIconLeft: {
    left: 12,
  },
  replyIconRight: {
    right: 12,
  },
});
