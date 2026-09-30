import api from "../../../api/axiosInstance";

const omicallApi = {
  getSipCredentials: () => api.get("/customer-call/sip-credentials", { requiresAuth: true }),
};

export default omicallApi;
