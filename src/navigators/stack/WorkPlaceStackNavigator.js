import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkPlaceBottomTab from "../bottomtabs/WorkPlaceBottomTab";
import WorkplaceFileViewerScreen from "../../screens/workplace/WorkplaceFileViewerScreen";

const Stack = createNativeStackNavigator();

export default function WorkPlaceStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkPlaceBottomTab" component={WorkPlaceBottomTab} />
      <Stack.Screen name="WorkplaceFileViewerScreen" component={WorkplaceFileViewerScreen} />
    </Stack.Navigator>
  );
}
