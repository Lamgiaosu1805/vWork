import { getListCustomers } from "../../api/crm/customer";

const useCustomer = () => {
  const getCustomers = async (params) => {
    try {
      const response = await getListCustomers(params);
      return response;
    } catch (error) {
      console.log("[Error GetListCustomers]", error);
    }
  };

  return {
    getCustomers,
  };
};

export default useCustomer;
