import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CRMBottomTab from "../bottomtabs/CRMBottomTab";
// import WorkDetailScreen from "../screens/workplace/WorkDetailScreen";
// import WorkSettingsScreen from "../screens/workplace/WorkSettingsScreen";
import ListAgentScreen from "../../screens/crm/ListAgentScreen";

const Stack = createNativeStackNavigator();

export default function CRMStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CRMBottomTab" component={CRMBottomTab} />
      <Stack.Screen name="ListAgentScreen" component={ListAgentScreen} />

    </Stack.Navigator>
  );
}
