import { useQuery } from "@tanstack/react-query";
import printApi from "../api/printApi";

const usePrintStatus = () =>
  useQuery({
    queryKey: ["print", "status"],
    queryFn: async () => {
      const res = await printApi.getStatus();
      const d = res.data ?? res;
      return { isOnline: d?.ok === true, printerName: d?.printer ? String(d.printer) : null };
    },
  });

export default usePrintStatus;
