import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AttendanceScreen from "../../screens/hrm/AttendanceScreen";
import DashboardHRMScreen from "../../screens/hrm/DashboardHRMScreen";
import RequestScreen from "../../screens/hrm/RequestScreen";
import ProfileScreen from "../../screens/hrm/ProfileScreen";
import ExpandScreen from "../../screens/hrm/ExpandScreen";
import CustomBottomTab from "./CustomBottomTab";

const Tab = createBottomTabNavigator();

export default function HRMBottomTab() {
  return (
    <Tab.Navigator
      initialRouteName={"DashboardHRMScreen"}
      tabBar={(props) => <CustomBottomTab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="DashboardHRMScreen" component={DashboardHRMScreen} />
      <Tab.Screen name="AttendanceScreen" component={AttendanceScreen} />
      <Tab.Screen name="RequestScreen" component={RequestScreen} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
      <Tab.Screen name="ExpandScreen" component={ExpandScreen} />
    </Tab.Navigator>
  );
}
