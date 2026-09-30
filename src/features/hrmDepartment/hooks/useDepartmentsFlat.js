import { useQuery } from "@tanstack/react-query";
import departmentApi from "../api/departmentApi";

const useDepartmentsFlat = () =>
  useQuery({
    queryKey: ["departments", "flat"],
    queryFn: async () => {
      const res = await departmentApi.getAll({ flat: true });
      return res.data?.data ?? [];
    },
  });

export default useDepartmentsFlat;
