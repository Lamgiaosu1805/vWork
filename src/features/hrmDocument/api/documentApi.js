import api from "../../../api/axiosInstance";

const documentApi = {
  getListDocument: () => api.get("/document/getListDocument", { requiresAuth: true }),
};

export default documentApi;
