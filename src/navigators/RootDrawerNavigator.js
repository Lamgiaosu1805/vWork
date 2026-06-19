import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { getPermissions } from "../helpers/permissions";
import WorkPlaceStackNavigator from "./stack/WorkPlaceStackNavigator";
import HRMStackNavigator from "./stack/HRMStackNavigator";
import CRMStackNavigator from "./stack/CRMStackNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";
import CustomDrawerContent from "../components/CustomDrawerContent";
import TestScreen from "../screens/TestScreen";
import TestScreen2 from "../screens/TestScreen2";
import SettingsScreen from "../screens/SettingsScreen";
import TwoFingerDrawerGestureWrapper from "../components/TwoFingerDrawerGestureWrapper";

const Drawer = createDrawerNavigator();

export default function RootDrawerNavigator({ route }) {
  const [initialRoute, setInitialRoute] = useState(null);
  const lastSavedRoute = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const perms = getPermissions(user);
  const hasCrm = perms.showCRM;

  useEffect(() => {
    const loadInitialRoute = async () => {
      try {
        const paramRoute = route?.params?.initialRoute;
        if (paramRoute) {
          const resolved =
            paramRoute === "CRMStackNavigator" && !hasCrm
              ? "WorkPlaceStackNavigator"
              : paramRoute;
          setInitialRoute(resolved);
          lastSavedRoute.current = resolved;
          return;
        }

        const lastStack = await AsyncStorage.getItem("lastStack");
        if (
          lastStack === "HRMStackNavigator" ||
          lastStack === "WorkPlaceStackNavigator" ||
          (lastStack === "CRMStackNavigator" && hasCrm)
        ) {
          setInitialRoute(lastStack);
          lastSavedRoute.current = lastStack;
        } else {
          setInitialRoute("WorkPlaceStackNavigator");
          lastSavedRoute.current = "WorkPlaceStackNavigator";
        }
      } catch (err) {
        console.error("Load initial route error:", err);
        setInitialRoute("WorkPlaceStackNavigator");
      }
    };

    loadInitialRoute();
  }, [route?.params?.initialRoute, hasCrm]);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#004643" />
      </View>
    );
  }

  return (
    <TwoFingerDrawerGestureWrapper>
      <Drawer.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          swipeEnabled: false,
          headerShown: false,
          drawerType: "front",
          swipeEdgeWidth: 80,
          overlayColor: "rgba(0,0,0,0.5)",
          drawerStyle: {
            width: "80%",
          },
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
                [
                  "HRMStackNavigator",
                  "WorkPlaceStackNavigator",
                  "CRMStackNavigator",
                ].includes(currentName) &&
                lastSavedRoute.current !== currentName
              ) {
                lastSavedRoute.current = currentName;
                await AsyncStorage.setItem("lastStack", currentName);
                console.log("💾 Saved lastStack =", currentName);
              }
            } catch (err) {
              console.error("Save lastStack error:", err);
            }
          },
        }}
      >
        <Drawer.Screen
          name="WorkPlaceStackNavigator"
          component={WorkPlaceStackNavigator}
          options={{ title: "WORKPLACE" }}
        />
        <Drawer.Screen
          name="HRMStackNavigator"
          component={HRMStackNavigator}
          options={{ title: "HRM" }}
        />
        {hasCrm && (
          <Drawer.Screen
            name="CRMStackNavigator"
            component={CRMStackNavigator}
            options={{ title: "CRM" }}
          />
        )}
      </Drawer.Navigator>
    </TwoFingerDrawerGestureWrapper>
  );
}
