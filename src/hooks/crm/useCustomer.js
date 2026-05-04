import { getListCustomers } from "../../api/crm/customer";

const useCustomer = () => {
  const getCustomers = async () => {
    try {
      const response = await getListCustomers();
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
