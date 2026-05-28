import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import WorkplaceDashboardScreen from "../../screens/workplace/WorkplaceDashboardScreen";
import WeeklyReportScreen from "../../screens/workplace/WeeklyReportScreen";
import InternalFilesScreen from "../../screens/workplace/InternalFilesScreen";
import FeedScreen from "../../screens/workplace/FeedScreen";
import ChatListScreen from "../../screens/workplace/chat/ChatListScreen";

const Tab = createBottomTabNavigator();

export default function WorkPlaceBottomTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#ED2E30",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName = "home-outline";
          if (route.name === "WorkplaceDashboard")
            iconName = "business-outline";
          else if (route.name === "FeedScreen") iconName = "newspaper-outline";
          else if (route.name === "ChatScreen")
            iconName = "chatbubbles-outline";
          else if (route.name === "WeeklyReportScreen")
            iconName = "calendar-outline";
          else if (route.name === "InternalFilesScreen")
            iconName = "folder-open-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="WorkplaceDashboard"
        component={WorkplaceDashboardScreen}
        options={{ title: "Workplace" }}
      />
      <Tab.Screen
        name="FeedScreen"
        component={FeedScreen}
        options={{ title: "Bảng tin" }}
      />
      <Tab.Screen
        name="ChatScreen"
        component={ChatListScreen}
        options={{ title: "Chat" }}
      />
      <Tab.Screen
        name="WeeklyReportScreen"
        component={WeeklyReportScreen}
        options={{ title: "Báo cáo tuần" }}
      />
      <Tab.Screen
        name="InternalFilesScreen"
        component={InternalFilesScreen}
        options={{ title: "Ổ File" }}
      />
    </Tab.Navigator>
  );
}
