import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HRMBottomTab from "../bottomtabs/HRMBottomTab";
import DocumentInfoScreen from "../../screens/hrm/DocumentInfoScreen";
import DocumentUserDetail from "../../screens/hrm/DocumentUserDetail";
import ShowFileScreen from "../../screens/hrm/ShowFileScreen";
import ChangePasswordScreen from "../../screens/hrm/ChangePasswordScreen";
import DepartmentScreen from "../../screens/hrm/DepartmentScreen";
import BranchScreen from "../../screens/hrm/BranchScreen";
import PrintScreen from "../../screens/hrm/PrintScreen";
import AttendanceConfigScreen from "../../screens/hrm/AttendanceConfigScreen";
import AttendanceOverviewScreen from "../../screens/hrm/AttendanceOverviewScreen";
import EmployeeListScreen from "../../screens/hrm/EmployeeListScreen";

const Stack = createNativeStackNavigator();

export default function HRMStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HRMBottomTab" component={HRMBottomTab} />
      <Stack.Screen
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
      />
      <Stack.Screen name="DocumentInfoScreen" component={DocumentInfoScreen} />
      <Stack.Screen
        name="DocumentUserDetailScreen"
        component={DocumentUserDetail}
      />
      <Stack.Screen name="ShowFileScreen" component={ShowFileScreen} />
      <Stack.Screen name="DepartmentScreen" component={DepartmentScreen} />
      <Stack.Screen name="BranchScreen" component={BranchScreen} />
      <Stack.Screen name="PrintScreen" component={PrintScreen} />
      <Stack.Screen name="AttendanceConfigScreen" component={AttendanceConfigScreen} />
      <Stack.Screen name="AttendanceOverviewScreen" component={AttendanceOverviewScreen} />
      <Stack.Screen name="EmployeeListScreen" component={EmployeeListScreen} />
    </Stack.Navigator>
  );
}
