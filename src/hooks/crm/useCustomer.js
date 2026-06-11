import { useState } from "react";
import {
  getCustomerDetailInfoApi,
  getCustomerFluctuationApi,
  getListCustomers,
  getInvestmentHoldingApi,
  viewImageApi,
  getStaffInfoApi,
} from "../../api/crm/customer";
import utils from "../../helpers/utils";

const useCustomer = () => {
  const [loading, setLoading] = useState(false);

  const getCustomers = async (params) => {
    setLoading(true);
    try {
      const response = await getListCustomers(params);
      return response;
    } catch (error) {
      console.log("[Error GetListCustomers]", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {Object} params
   * @param {string} params.external_id
   */
  const getCustomerDetailInfo = async (params) => {
    setLoading(true);
    try {
      const response = await getCustomerDetailInfoApi(params);
      return response;
    } catch (error) {
      console.log("[Error getCustomerDetailInfo]", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {Object} params
   * @param {string} params.external_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {string} params.limit
   * @param {string} params.page
   */
  const getCustomerFluctuation = async (params) => {
    setLoading(true);
    try {
      const response = await getCustomerFluctuationApi(params);

      return response;
    } catch (error) {
      console.log("[Error getCustomerFluctuation]", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {Object} params
   * @param {string} params.key_image
   */
  const getViewImage = async (params) => {
    setLoading(true);
    try {
      const response = await viewImageApi(params);
      
      return response;
    } catch (error) {
      console.log("[Error getViewImage]", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {Object} params
   * @param {string} params.external_id
   * @param {string} params.pageSize
   * @param {string} params.pageNumber
   * @param {string} params.type
   * @param {string} params.fromDate
   * @param {string} params.toDate
   */
  const getInvestmentHolding = async (params) => {
    setLoading(true);
    try {
      const response = await getInvestmentHoldingApi(params);
      return response.data;
    } catch (error) {
      console.log("[Error getInvestmentHolding]", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {Object} params
   * @param {string} params.ma_nv
   */
  const getStaffInfo = async (params) => {
    setLoading(true);
    try {
      const response = await getStaffInfoApi(params);
      return response;
    } catch (error) {
      console.log("[Error getStaffInfo]", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    getCustomers,
    getCustomerDetailInfo,
    getCustomerFluctuation,
    getViewImage,
    getInvestmentHolding,
    getStaffInfo,
    loading,
  };
};

export default useCustomer;

