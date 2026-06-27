import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AttendanceScreen from "../../screens/hrm/AttendanceScreen";
import DashboardCRMScreen from "../../screens/crm/DashboardCRMScreen";
import CustomerScreen from "../../screens/crm/CustomerScreen";
import CommissionScreen from "../../screens/crm/CommissionScreen";
import ExpandCRMScreen from "../../screens/crm/ExpandCRMScreen";
import KPIScreen from "../../screens/crm/KPIScreen";
import CustomBottomTab from "./CustomBottomTab";

const Tab = createBottomTabNavigator();

export default function CRMBottomTab() {
  return (
    <Tab.Navigator
      initialRouteName={"Dashboard"}
      tabBar={(props) => <CustomBottomTab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardCRMScreen} />
      <Tab.Screen name="Customers" component={CustomerScreen} />
      <Tab.Screen name="KPI" component={KPIScreen} />
      <Tab.Screen name="Commission" component={CommissionScreen} />
      <Tab.Screen name="ExpandScreen" component={ExpandCRMScreen} />
    </Tab.Navigator>
  );
}
