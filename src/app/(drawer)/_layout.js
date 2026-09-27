import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { Drawer } from "expo-router/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPermissions } from "../../helpers/permissions";
import CustomDrawerContent from "../../components/CustomDrawerContent";
import TwoFingerDrawerGestureWrapper from "../../components/TwoFingerDrawerGestureWrapper";

export default function DrawerLayout() {
  const user = useSelector((state) => state.auth.user);
  const perms = getPermissions(user);
  const hasCrm = perms.showCRM;
  const lastSavedRoute = useRef(null);

  return (
    <TwoFingerDrawerGestureWrapper>
      <Drawer
        initialRouteName="workplace"
        screenOptions={{
          swipeEnabled: false,
          headerShown: false,
          drawerType: "front",
          swipeEdgeWidth: 80,
          overlayColor: "rgba(0,0,0,0.5)",
          drawerStyle: { width: "80%" },
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenListeners={{
          state: async (e) => {
            try {
              const state = e.data?.state;
              if (!state?.routes?.length) return;
              const current = state.routes[state.index];
              const currentName = current?.name;

              if (
                ["workplace", "hrm", "crm"].includes(currentName) &&
                lastSavedRoute.current !== currentName
              ) {
                lastSavedRoute.current = currentName;
                await AsyncStorage.setItem("lastStack", currentName);
              }
            } catch (err) {
              console.error("Save lastStack error:", err);
            }
          },
        }}
      >
        <Drawer.Screen name="workplace" options={{ title: "WORKPLACE" }} />
        <Drawer.Screen name="hrm" options={{ title: "HRM" }} />
        {hasCrm && <Drawer.Screen name="crm" options={{ title: "CRM" }} />}
      </Drawer>
    </TwoFingerDrawerGestureWrapper>
  );
}
