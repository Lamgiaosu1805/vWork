import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkPlaceBottomTab from "../bottomtabs/WorkPlaceBottomTab";
import HRMBottomTab from "../bottomtabs/HRMBottomTab";
// import WorkDetailScreen from "../screens/workplace/WorkDetailScreen";
// import WorkSettingsScreen from "../screens/workplace/WorkSettingsScreen";

const Stack = createNativeStackNavigator();

export default function HRMStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="HRMBottomTab" component={HRMBottomTab} />

    </Stack.Navigator>
  );
}