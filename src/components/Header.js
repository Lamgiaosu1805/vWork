import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../assets/theme/colors";
import useTheme from "../assets/theme/useTheme";

const Header = ({
  title,
  LeftIcon,
  onLeftPress,
  RightIcon,
  onRightPress,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const ICON_SIZE = 24;
  const ICON_COLOR = COLORS.text.dark;

  const renderIcon = (Icon, onPress) => {
    if (!Icon) {
      return <View style={styles.iconPlaceholder} />;
    }

    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.iconContainer}
        disabled={!onPress}
      >
        <Icon size={ICON_SIZE} color={ICON_COLOR} />
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 12,
          backgroundColor: colors.white,
        },
      ]}
    >
      {renderIcon(LeftIcon, onLeftPress)}

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {renderIcon(RightIcon, onRightPress)}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlaceholder: {
    width: 40,
    height: "100%",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.Primary,
  },
});

export default Header;
