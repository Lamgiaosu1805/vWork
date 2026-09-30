import React from "react";
import { Stack } from "expo-router";
import DrawerBridge from "../../../components/DrawerBridge";
import AiChatbotModal from "../../../features/crm/components/AiChatbotModal";
import OmikitCallManager from "../../../features/crm/components/omicall/OmikitCallManager";
import { AppSwitcherProvider } from "../../../features/crm/context/AppSwitcherContext";

export default function CrmPreviewLayout() {
  return (
    <AppSwitcherProvider>
      <DrawerBridge />
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }} />
      <AiChatbotModal />
      <OmikitCallManager />
    </AppSwitcherProvider>
  );
}
