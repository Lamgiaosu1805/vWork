import { View } from "react-native";
import CRMStackNavigator from "../../navigators/stack/CRMStackNavigator";
import DrawerBridge from "../../components/DrawerBridge";

export default function CrmRoute() {
  return (
    <View style={{ flex: 1 }}>
      <DrawerBridge />
      <CRMStackNavigator />
    </View>
  );
}
