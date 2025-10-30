import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CRMBottomTab from "../bottomtabs/CRMBottomTab";
// import WorkDetailScreen from "../screens/workplace/WorkDetailScreen";
// import WorkSettingsScreen from "../screens/workplace/WorkSettingsScreen";

const Stack = createNativeStackNavigator();

export default function CRMStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="CRMBottomTab" component={CRMBottomTab} />

    </Stack.Navigator>
  );
}