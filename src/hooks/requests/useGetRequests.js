import { useEffect, useState } from "react";
import requestsApi from "../../api/requestsApi";

const useGetRequests = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response = await requestsApi.getRequests(params);

      setData(response?.data || response);

      return response?.data;
    } catch (error) {
      console.log("[Error GET requests]", error);

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

export default useGetRequests;
