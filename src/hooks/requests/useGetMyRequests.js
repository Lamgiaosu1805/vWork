import { useEffect, useState } from "react";
import requestsApi from "../../api/requestsApi";

const useGetMyRequests = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response = await requestsApi.getMyRequests(params);

      setData(response?.data || response);

      return response?.data;
    } catch (error) {
      console.log("[Error GET my requests]", error);

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(params)]);

  return {
    data,
    isLoading,
    refetch: fetchData,
  };
};

export default useGetMyRequests;
