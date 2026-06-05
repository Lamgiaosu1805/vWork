import { useEffect, useState } from "react";
import requestsApi from "../../api/requestsApi";
import shiftApi from "../../api/shift";

const useGetAllShift = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response = await shiftApi.getAllShifts();

      setData(response?.data?.data || []);

      return response?.data?.data;
    } catch (error) {
      console.log("[Error GET all shifts]", error);

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

export default useGetAllShift;
