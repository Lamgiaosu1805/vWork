import { useState } from "react";
import { getBirthdayThisMonthApi } from "../api/user";

const useUser = () => {
  const [loading, setLoading] = useState(false);

  const getBirthdayThisMonth = async () => {
    setLoading(true);
    try {
      const response = await getBirthdayThisMonthApi();
      return response;
    } catch (error) {
      console.log("[Error GET list birthday]", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getBirthdayThisMonth,
    loading,
  };
};

export default useUser;
