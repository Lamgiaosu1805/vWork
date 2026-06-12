import { useEffect, useState } from "react";
import requestsApi from "../../api/requestsApi";

const useGetAttendanceCalendar = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response = await requestsApi.getAttendanceCalendar(params);

      setData(response?.data?.data || response);

      return response?.data?.data;
    } catch (error) {
      console.log("[Error GET attendance calendar]", error);

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

export default useGetAttendanceCalendar;
