import api from "../../../api/axiosInstance";

const permissionApi = {
  getMyPermissions: () => api.get("/permissions/me", { requiresAuth: true }),
};

export default permissionApi;
