import api from "../../../api/axiosInstance";

const investmentApi = {
  getList: (params) =>
    api.get("/investments/list", { requiresAuth: true, params }),
};

export default investmentApi;
