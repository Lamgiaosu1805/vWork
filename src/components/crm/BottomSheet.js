import React, { useState } from "react";
import { Pressable, StyleSheet, View, Modal, Platform } from "react-native";
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
  scrollY,
}) => {
  const startY = useSharedValue(0);
  const contentGesture = Gesture.Native();
  const [modalVisible, setModalVisible] = useState(false);

  useAnimatedReaction(
    () => translateY.value < HEIGHT_SHEET,
    (isOpen, prev) => {
      if (isOpen !== prev) {
        runOnJS(setModalVisible)(isOpen);
      }
    },
  );

  const gesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .failOffsetX([-12, 12])
    .simultaneousWithExternalGesture(contentGesture ?? undefined)
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = startY.value + e.translationY;
      const canMove =
        typeof scrollY === "undefined" ||
        scrollY.value <= 0 ||
        translateY.value > 0;

      if (canMove) {
        translateY.value = Math.max(0, next);
      }
    })
    .onEnd((e) => {
      const shouldClose = translateY.value > 100;

      translateY.value = withTiming(shouldClose ? HEIGHT_SHEET : 0);
      // first arg: whether this was a gesture; second: whether the sheet will close
      runOnJS(onClose)(true, shouldClose);
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
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={() => onClose(false)}
    >
      <View style={[styles.container]} pointerEvents="box-none">
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => onClose(false, true)}
          />
        </Animated.View>
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.sheet,
              animatedStyle,
              { backgroundColor, zIndex: 1000, elevation: 20, flex: 1 },
            ]}
          >
            <View
              style={{
                width: "100%",
                paddingVertical: 16,
              }}
            >
              <View style={styles.handle} />
            </View>

            <GestureDetector gesture={contentGesture}>
              {children}
            </GestureDetector>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
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
    height: "90%",
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
