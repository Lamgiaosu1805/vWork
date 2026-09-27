import { Stack } from "expo-router";
import DrawerBridge from "../../../components/DrawerBridge";

export default function WorkplaceLayout() {
  return (
    <>
      <DrawerBridge />
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }} />
    </>
  );
}
