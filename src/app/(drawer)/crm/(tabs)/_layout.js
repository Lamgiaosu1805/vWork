import React from "react";
import { Tabs } from "expo-router";
import CrmBottomTab from "../../../../features/crm/components/CrmBottomTab";
import {
  countNeedsAction,
  useCustomerCarePermissions,
  useMyCareQueue,
} from "../../../../features/crmCustomerCare";

export default function CrmPreviewTabsLayout() {
  const { showCustomerCareQueue } = useCustomerCarePermissions();
  // Poll hàng đợi ở cấp layout để badge tab "Xử lý" luôn mới khi Sale ở bất kỳ tab CRM nào
  const queueQuery = useMyCareQueue({ enabled: showCustomerCareQueue });
  const needsAction = countNeedsAction(queueQuery.data?.items);

  return (
    <Tabs
      initialRouteName="dashboard"
      tabBar={(props) => <CrmBottomTab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen
        name="customer-care"
        options={{ crmHidden: !showCustomerCareQueue, tabBarBadge: needsAction > 0 ? needsAction : undefined }}
      />
      <Tabs.Screen name="tickets" />
      <Tabs.Screen name="commission" />
    </Tabs>
  );
}
