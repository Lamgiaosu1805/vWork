import { useQuery } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useDeptFiles = (deptId, folderId) =>
  useQuery({
    queryKey: ["deptFiles", deptId, folderId],
    queryFn: async () => {
      const res = await workplaceApi.getDeptFiles(deptId, folderId);
      return res.data?.data ?? [];
    },
    enabled: !!deptId,
  });

export default useDeptFiles;
