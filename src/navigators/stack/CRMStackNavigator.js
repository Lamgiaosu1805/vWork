import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CRMBottomTab from "../bottomtabs/CRMBottomTab";
// import WorkDetailScreen from "../screens/workplace/WorkDetailScreen";
// import WorkSettingsScreen from "../screens/workplace/WorkSettingsScreen";
import ListAgentScreen from "../../screens/crm/ListAgentScreen";
import AdminCustomerScreen from "../../screens/crm/AdminCustomerScreen";
import ClaimRequestScreen from "../../screens/crm/ClaimRequestScreen";
import InvestmentScreen from "../../screens/crm/InvestmentScreen";

const Stack = createNativeStackNavigator();

export default function CRMStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CRMBottomTab" component={CRMBottomTab} />
      <Stack.Screen name="ListAgentScreen" component={ListAgentScreen} />
      <Stack.Screen name="AdminCustomerScreen" component={AdminCustomerScreen} />
      <Stack.Screen name="ClaimRequestScreen" component={ClaimRequestScreen} />
      <Stack.Screen name="InvestmentScreen" component={InvestmentScreen} />
    </Stack.Navigator>
  );
}
