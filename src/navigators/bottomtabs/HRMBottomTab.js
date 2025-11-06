import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import TestScreen from "../../screens/TestScreen";
import AttendanceScreen from "../../screens/hrm/AttendanceScreen";
import DashboardHRMScreen from "../../screens/hrm/DashboardHRMScreen";
import RequestScreen from "../../screens/hrm/RequestScreen";
import ProfileScreen from "../../screens/hrm/ProfileScreen";
import ExpandScreen from "../../screens/hrm/ExpandScreen";

const Tab = createBottomTabNavigator();

export default function HRMBottomTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#09A896",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "DashboardHRMScreen") iconName = "people";
          else if (route.name === "AttendanceScreen") iconName = "alarm";
          else if (route.name === "RequestScreen") iconName = "create";
          else if (route.name === "ProfileScreen") iconName = "person";
          else if (route.name === "ExpandScreen") iconName = "apps";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardHRMScreen"
        component={DashboardHRMScreen}
        options={{ title: "HRM" }}
      />
      <Tab.Screen
        name="AttendanceScreen"
        component={AttendanceScreen}
        options={{ title: "Chấm công" }}
      />
      <Tab.Screen
        name="RequestScreen"
        component={RequestScreen}
        options={{ title: "Yêu cầu" }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: "Hồ sơ" }}
      />
       <Tab.Screen
        name="ExpandScreen"
        component={ExpandScreen}
        options={{ title: "Mở rộng" }}
      />
    </Tab.Navigator>
  );
}
