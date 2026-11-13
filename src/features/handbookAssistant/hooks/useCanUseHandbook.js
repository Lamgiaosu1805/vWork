import { useMyPermissions } from "../../permission";
import { HANDBOOK_ASSISTANT_PERMISSION } from "../constants";

// Không bypass admin — khớp backend requirePermission (giống web).
const useCanUseHandbook = () => {
  const { canAny, isLoading } = useMyPermissions();
  return { canUse: canAny([HANDBOOK_ASSISTANT_PERMISSION]), isLoading };
};

export default useCanUseHandbook;
