import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { memo, useCallback } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { COLORS } from "../../assets/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { getTabColor, TAB_CONFIG } from "./tabConfig";

const SCREEN_W = Dimensions.get("window").width;
const H_PAD = 4;
const TAB_COUNT = 5;
const TAB_W = (SCREEN_W - H_PAD * 2) / TAB_COUNT;

const CustomBottomTab = ({ state, navigation, getBadge }) => {
  const pillX = useSharedValue(state.index * TAB_W);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  const handlePress = useCallback(
    (index, routeKey, routeName) => {
      const isFocused = state.index === index;

      pillX.value = withSpring(index * TAB_W, {
        damping: 18,
        stiffness: 170,
        mass: 0.9,
      });

      const event = navigation.emit({
        type: "tabPress",
        target: routeKey,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation, pillX, state.index],
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Animated.View
          pointerEvents="none"
          style={[styles.activePill, pillStyle]}
        />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];

          const color = getTabColor(isFocused);
          const badgeCount = getBadge?.(route.name) ?? 0;

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={1}
              onPress={() => handlePress(index, route.key, route.name)}
              style={styles.tabButton}
            >
              <View>
                <Ionicons name={config.icon} size={20} color={color} />
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.tabText,
                  {
                    color: isFocused
                      ? COLORS.Primary
                      : COLORS.neutral.neutral400,
                  },
                ]}
              >
                {config.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default memo(CustomBottomTab);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 25,
    paddingTop: 7,
    paddingHorizontal: H_PAD,
  },

  activePill: {
    position: "absolute",
    top: 7,
    left: H_PAD,
    width: TAB_W,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.Tertiary,
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 9.5,
    paddingHorizontal: 9,
    borderRadius: 27,
  },

  tabText: {
    fontSize: 9,
    fontWeight: "700",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ED2E30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
    lineHeight: 11,
  },
});
