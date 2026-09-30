import React from "react";
import { Tabs } from "expo-router";
import CrmBottomTab from "../../../../features/crm/components/CrmBottomTab";

export default function CrmPreviewTabsLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      tabBar={(props) => <CrmBottomTab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="tickets" />
      <Tabs.Screen name="commission" />
    </Tabs>
  );
}
