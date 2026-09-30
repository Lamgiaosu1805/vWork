import api from "../../../api/axiosInstance";

const agentApi = {
  getAll: (params) => api.get("/agents", { requiresAuth: true, params }),
};

export default agentApi;
