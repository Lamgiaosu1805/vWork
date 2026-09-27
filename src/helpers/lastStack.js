import AsyncStorage from "@react-native-async-storage/async-storage";

const VALID_ROUTES = ["workplace", "hrm", "crm"];

export const resolveInitialRoute = async (hasCrm) => {
  const lastStack = await AsyncStorage.getItem("lastStack");

  if (lastStack === "crm" && !hasCrm) return "workplace";
  if (VALID_ROUTES.includes(lastStack)) return lastStack;

  return "workplace";
};
