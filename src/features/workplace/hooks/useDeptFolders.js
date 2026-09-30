import { useQuery } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useDeptFolders = (deptId, folderId) =>
  useQuery({
    queryKey: ["deptFolders", deptId, folderId],
    queryFn: async () => {
      const res = await workplaceApi.getDeptFolders(deptId, folderId);
      return res.data?.data ?? [];
    },
    enabled: !!deptId,
  });

export default useDeptFolders;
