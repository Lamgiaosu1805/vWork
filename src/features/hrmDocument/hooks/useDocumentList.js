import { useQuery } from "@tanstack/react-query";
import documentApi from "../api/documentApi";

const useDocumentList = () =>
  useQuery({
    queryKey: ["documentList"],
    queryFn: async () => {
      const res = await documentApi.getListDocument();
      return res.data.data;
    },
  });

export default useDocumentList;
