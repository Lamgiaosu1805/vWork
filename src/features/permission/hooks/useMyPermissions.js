import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import permissionApi from "../api/permissionApi";
import { hasAnyPermission } from "../lib/hasAnyPermission";

/**
 * Không tự bypass role=admin ở đây — khớp với BE requirePermission (không
 * bypass), admin phải thật sự có permission qua role gán quyền. Giống hệt
 * useMyPermissions bên website-crm.
 */
const useMyPermissions = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["my-effective-permissions"],
    queryFn: async () => {
      const res = await permissionApi.getMyPermissions();
      return res.data?.data?.permissions ?? [];
    },
    enabled: !!accessToken,
  });

  const canAny = (codes) => hasAnyPermission(permissions, codes);

  return { permissions, canAny, isLoading };
};

export default useMyPermissions;
