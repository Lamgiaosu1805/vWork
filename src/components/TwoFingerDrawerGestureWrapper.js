// src/components/TwoFingerDrawerGestureWrapper.js
import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { openDrawer } from '../helpers/navigationRef';

export default function TwoFingerDrawerGestureWrapper({ children }) {
  const twoFingerSwipe = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .onEnd((e, success) => {
      if (success && e.translationX > 60 && Math.abs(e.translationY) < 40) {
        openDrawer();
      }
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={twoFingerSwipe}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
