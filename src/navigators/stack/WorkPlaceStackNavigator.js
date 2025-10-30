import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkPlaceBottomTab from "../bottomtabs/WorkPlaceBottomTab";
// import WorkDetailScreen from "../screens/workplace/WorkDetailScreen";
// import WorkSettingsScreen from "../screens/workplace/WorkSettingsScreen";

const Stack = createNativeStackNavigator();

export default function WorkPlaceStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="WorkPlaceBottomTab" component={WorkPlaceBottomTab} />

    </Stack.Navigator>
  );
}