import { useQuery } from "@tanstack/react-query";
import departmentApi from "../api/departmentApi";

const useDepartments = () =>
  useQuery({
    queryKey: ["departments", "tree"],
    queryFn: async () => {
      const res = await departmentApi.getAll();
      return res.data?.data ?? [];
    },
  });

export default useDepartments;
