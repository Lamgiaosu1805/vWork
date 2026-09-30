import { useQuery } from "@tanstack/react-query";
import homeApi from "../api/homeApi";

const useChurnRisks = () =>
  useQuery({
    queryKey: ["crmChurnRisks"],
    queryFn: async () => {
      const res = await homeApi.getChurnRisks();
      return res.data;
    },
  });

export default useChurnRisks;
