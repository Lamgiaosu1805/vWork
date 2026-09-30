import api from "../../../api/axiosInstance";

const printApi = {
  getStatus: () => api.get("/print/status", { requiresAuth: true }),
  getStats: () => api.get("/print/stats", { requiresAuth: true }),
  getHistory: (params) => api.get("/print/history", { requiresAuth: true, params }),
  submit: (formData) =>
    api.post("/print", formData, {
      requiresAuth: true,
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    }),
};

export default printApi;
