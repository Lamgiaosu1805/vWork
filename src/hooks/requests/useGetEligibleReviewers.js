import { useEffect, useState } from "react";
import requestsApi from "../../api/requestsApi";

const useGetEligibleReviewers = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response = await requestsApi.getEligibleReviewers();

      setData(response?.data?.data || []);

      return response?.data?.data;
    } catch (error) {
      console.log("[Error GET eligible reviewers]", error);

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

export default useGetEligibleReviewers;
