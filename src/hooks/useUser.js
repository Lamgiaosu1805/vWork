import { useState } from "react";
import { getBirthdayThisMonthApi, getUsersApi } from "../api/user";

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

  const getUsers = async (params = {}) => {
    setLoading(true);
    try {
      const response = await getUsersApi(params);
      return response;
    } catch (error) {
      console.log("[Error GET list users]", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getBirthdayThisMonth,
    getUsers,
    loading,
  };
};

export default useUser;
