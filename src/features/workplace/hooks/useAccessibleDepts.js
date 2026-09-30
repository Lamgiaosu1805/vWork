import { useQuery } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useAccessibleDepts = () =>
  useQuery({
    queryKey: ["accessibleDepts"],
    queryFn: async () => {
      const res = await workplaceApi.getAccessibleDepts();
      return res.data?.data ?? [];
    },
  });

export default useAccessibleDepts;
