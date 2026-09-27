import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { registerDrawerNavigation } from "../helpers/navigationRef";

export default function DrawerBridge() {
  const navigation = useNavigation();

  useEffect(() => {
    registerDrawerNavigation(navigation);
  }, [navigation]);

  return null;
}
