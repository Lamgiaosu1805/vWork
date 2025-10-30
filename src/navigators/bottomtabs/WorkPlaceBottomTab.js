import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import TestScreen from "../../screens/TestScreen";
import WorkScreen from "../../screens/workplace/WorkScreen";
// import WorkDashboardScreen from "../screens/workplace/WorkDashboardScreen";
// import WorkTaskScreen from "../screens/workplace/WorkTaskScreen";
// import WorkProfileScreen from "../screens/workplace/WorkProfileScreen";

const Tab = createBottomTabNavigator();

export default function WorkPlaceBottomTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName = "home-outline";
          if (route.name === "Dashboard") iconName = "business-outline";
          else if (route.name === "Tasks") iconName = "briefcase-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={TestScreen}
        options={{ title: "WorkPlace" }}
      />
      <Tab.Screen
        name="Tasks"
        component={WorkScreen}
        options={{ title: "Công việc" }}
      />
      <Tab.Screen
        name="Profile"
        component={TestScreen}
        options={{ title: "Hồ sơ" }}
      />
    </Tab.Navigator>
  );
}
