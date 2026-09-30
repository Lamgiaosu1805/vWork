import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { memo, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { PhoneCall } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CRM_COLORS, CRM_RADIUS } from "../theme/colors";
import { openDialPad } from "../../../helpers/omicallDialRef";

const CRM_TAB_CONFIG = {
  dashboard: { title: "Trang chủ", icon: "home-outline", activeIcon: "home" },
  customers: { title: "Khách hàng", icon: "people-outline", activeIcon: "people" },
  tickets: { title: "Hỗ trợ", icon: "ticket-outline", activeIcon: "ticket" },
  commission: { title: "Hoa hồng", icon: "wallet-outline", activeIcon: "wallet" },
};

const CrmBottomTab = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (index, routeKey, routeName) => {
      const isFocused = state.index === index;
      const event = navigation.emit({
        type: "tabPress",
        target: routeKey,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation, state.index],
  );

  const renderTabButton = (route, index) => {
    const isFocused = state.index === index;
    const config = CRM_TAB_CONFIG[route.name];
    if (!config) return null;
    const color = isFocused ? CRM_COLORS.accent : CRM_COLORS.inactiveTab;

    return (
      <TouchableOpacity
        key={route.key}
        activeOpacity={0.8}
        onPress={() => handlePress(index, route.key, route.name)}
        style={styles.tabButton}
      >
        <Ionicons
          name={isFocused ? config.activeIcon : config.icon}
          size={24}
          color={color}
        />
        <Text style={[styles.tabText, { color, fontWeight: isFocused ? "700" : "500" }]}>
          {config.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.slice(0, 2).map((route, index) => renderTabButton(route, index))}

      <View style={styles.callButtonSlot}>
        <TouchableOpacity style={styles.callButton} activeOpacity={0.85} onPress={() => openDialPad()}>
          <PhoneCall size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {state.routes.slice(2).map((route, index) => renderTabButton(route, index + 2))}
    </View>
  );
};

export default memo(CrmBottomTab);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 40,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabText: {
    fontSize: 10,
  },
  callButtonSlot: {
    flex: 1,
    alignItems: "center",
  },
  callButton: {
    width: 56,
    height: 56,
    borderRadius: CRM_RADIUS.pill,
    backgroundColor: CRM_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    shadowColor: CRM_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#fff",
  },
});
