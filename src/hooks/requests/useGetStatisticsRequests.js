import { useEffect, useState } from "react";
import requestsApi from "../../api/requestsApi";

const useGetStatisticsRequests = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response = await requestsApi.getStatisticsRequests();

      setData(response?.data?.data || response);

      return response?.data?.data;
    } catch (error) {
      console.log("[Error GET statistics requests]", error);

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    refetch: fetchData,
  };
};

export default useGetStatisticsRequests;
