import React from "react";
import { Stack } from "expo-router";
import DrawerBridge from "../../../components/DrawerBridge";
import AiChatbotModal from "../../../features/crm/components/AiChatbotModal";
import OmikitCallManager from "../../../features/crm/components/omicall/OmikitCallManager";
import { AppSwitcherProvider } from "../../../features/crm/context/AppSwitcherContext";
import { CustomerCareReportHost } from "../../../features/crmCustomerCare";

export default function CrmPreviewLayout() {
  return (
    <AppSwitcherProvider>
      <DrawerBridge />
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }} />
      <AiChatbotModal />
      <OmikitCallManager />
      <CustomerCareReportHost />
    </AppSwitcherProvider>
  );
}
