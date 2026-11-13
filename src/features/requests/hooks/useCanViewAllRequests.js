import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import requestsApi from "../api/requestsApi";
import useMyPermissions from "../../permission/hooks/useMyPermissions";
import { getPermissions } from "../../../helpers/permissions";

/**
 * Xem được đơn của người khác: mã cũ hrm.request.view_all, hoặc request.view (hệ quyền mới) với phạm vi
 * rộng hơn "chính mình" — BE trả qua /requests/view-scope vì role Nhân viên ai cũng có request.view (SELF).
 */
const useCanViewAllRequests = () => {
  const user = useSelector((state) => state.auth.user);
  const { permissions } = useMyPermissions();

  const { data: canViewOthers = false } = useQuery({
    queryKey: ["requests", "view-scope"],
    queryFn: async () => {
      const res = await requestsApi.getRequestViewScope();
      return Boolean(res.data?.data?.canViewOthers);
    },
    enabled: permissions.includes("request.view"),
  });

  return getPermissions(user).canViewAllRequests || canViewOthers;
};

export default useCanViewAllRequests;
