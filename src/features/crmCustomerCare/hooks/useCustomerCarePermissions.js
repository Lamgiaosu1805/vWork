import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getPermissions } from "../../../helpers/permissions";
import {
  useMyPermissions,
  CRM_CUSTOMER_INTERACTION_CREATE_PERMISSIONS,
  CRM_CUSTOMER_INTERACTION_VIEW_PERMISSIONS,
} from "../../permission";

/**
 * Named flag showCustomerCareQueue / showCustomerCareMgmt lấy từ getPermissions(user, permissions) —
 * truyền permission code hiệu lực của GET /permissions/me (không bypass admin, khớp BE).
 */
const useCustomerCarePermissions = () => {
  const user = useSelector((state) => state.auth.user);
  const { permissions, isLoading } = useMyPermissions();

  return useMemo(() => {
    const flags = getPermissions(user, permissions);
    return {
      showCustomerCareQueue: flags.showCustomerCareQueue,
      showCustomerCareMgmt: flags.showCustomerCareMgmt,
      canCreateCareReport: CRM_CUSTOMER_INTERACTION_CREATE_PERMISSIONS.some((c) => permissions.includes(c)),
      canViewCareReports: CRM_CUSTOMER_INTERACTION_VIEW_PERMISSIONS.some((c) => permissions.includes(c)),
      isLoading,
    };
  }, [user, permissions, isLoading]);
};

export default useCustomerCarePermissions;
