import { Tabs } from "expo-router";
import CustomBottomTab from "../../../../navigators/bottomtabs/CustomBottomTab";

export default function HrmTabsLayout() {
  return (
    <Tabs
      initialRouteName="attendance"
      tabBar={(props) => <CustomBottomTab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="attendance" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="expand" />
    </Tabs>
  );
}
