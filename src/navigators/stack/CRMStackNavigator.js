import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CRMBottomTab from "../bottomtabs/CRMBottomTab";
import ListAgentScreen from "../../screens/crm/ListAgentScreen";
import AdminCustomerScreen from "../../screens/crm/AdminCustomerScreen";
import ClaimRequestScreen from "../../screens/crm/ClaimRequestScreen";
import InvestmentScreen from "../../screens/crm/InvestmentScreen";
import CustomerDetailScreen from "../../screens/crm/CustomerDetailScreen";
import AiChatbotModal from "../../components/crm/AiChatbotModal";

const Stack = createNativeStackNavigator();

export default function CRMStackNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CRMBottomTab" component={CRMBottomTab} />
        <Stack.Screen name="ListAgentScreen" component={ListAgentScreen} />
        <Stack.Screen name="AdminCustomerScreen" component={AdminCustomerScreen} />
        <Stack.Screen name="ClaimRequestScreen" component={ClaimRequestScreen} />
        <Stack.Screen name="InvestmentScreen" component={InvestmentScreen} />
        <Stack.Screen name="CustomerDetailScreen" component={CustomerDetailScreen} />
      </Stack.Navigator>
      <AiChatbotModal />
    </View>
  );
}
