import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import TestScreen from "../../screens/TestScreen";
import AttendanceScreen from "../../screens/hrm/AttendanceScreen";

const Tab = createBottomTabNavigator();

export default function CRMBottomTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName = "home-outline";
          if (route.name === "Dashboard") iconName = "cart-outline";
          else if (route.name === "Tasks") iconName = "briefcase-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={TestScreen}
        options={{ title: "CRM" }}
      />
      <Tab.Screen
        name="Tasks"
        component={AttendanceScreen}
        options={{ title: "Chấm công" }}
      />
      <Tab.Screen
        name="Profile"
        component={TestScreen}
        options={{ title: "Hồ sơ" }}
      />
    </Tab.Navigator>
  );
}
