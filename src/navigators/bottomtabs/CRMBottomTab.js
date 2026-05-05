import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import TestScreen from "../../screens/TestScreen";
import AttendanceScreen from "../../screens/hrm/AttendanceScreen";
import DashboardCRMScreen from "../../screens/crm/DashboardCRMScreen";
import CustomerScreen from "../../screens/crm/CustomerScreen";
import CommissionScreen from "../../screens/crm/CommissionScreen";
import ExpandCRMScreen from "../../screens/crm/ExpandCRMScreen";
// Import thêm màn hình KPI
import KPIScreen from "../../screens/crm/KPIScreen";

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
          else if (route.name === "Customers") iconName = "people-outline";
          else if (route.name === "KPI") iconName = "stats-chart-outline"; // Icon biểu đồ cho KPI
          else if (route.name === "Commission") iconName = "cash-outline";
          else if (route.name === "ExpandScreen") iconName = "apps";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardCRMScreen}
        options={{ title: "Home CRM" }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomerScreen}
        options={{ title: "Khách hàng" }}
      />
      {/* Thêm Tab KPI vào vị trí chính giữa */}
      <Tab.Screen
        name="KPI"
        component={KPIScreen}
        options={{ title: "KPI" }}
      />
      <Tab.Screen
        name="Commission"
        component={CommissionScreen}
        options={{ title: "Hoa hồng" }}
      />
      <Tab.Screen
        name="ExpandScreen"
        component={ExpandCRMScreen}
        options={{ title: "Mở rộng" }}
      />
    </Tab.Navigator>
  );
}