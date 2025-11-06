import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HRMBottomTab from "../bottomtabs/HRMBottomTab";
import DocumentInfoScreen from "../../screens/hrm/DocumentInfoScreen";
const Stack = createNativeStackNavigator();

export default function HRMStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="HRMBottomTab" component={HRMBottomTab} />
      <Stack.Screen name="DocumentInfoScreen" component={DocumentInfoScreen} />

    </Stack.Navigator>
  );
}