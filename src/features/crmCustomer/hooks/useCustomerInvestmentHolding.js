import { useInfiniteQuery } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useCustomerInvestmentHolding = (externalId, dateRange = {}) =>
  useInfiniteQuery({
    queryKey: ["crmCustomerInvestmentHolding", externalId, dateRange],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await customerApi.getInvestmentHolding({
        external_id: externalId,
        pageSize: 10,
        pageNumber: pageParam,
        type: 1,
        fromDate: dateRange.from ? dateRange.from.format("YYYY-MM-DD") : null,
        toDate: dateRange.to ? dateRange.to.format("YYYY-MM-DD") : null,
      });
      const totalRecords = res?.data?.data?.totalRecords ?? 0;
      return {
        items: res?.data?.data?.investmentHoldingProducts ?? [],
        page: pageParam,
        totalPages: Math.ceil(totalRecords / 10),
        total: totalRecords,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: !!externalId,
  });

export default useCustomerInvestmentHolding;
