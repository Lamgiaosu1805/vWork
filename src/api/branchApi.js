import api from "./axiosInstance";

const branchApi = {
  getAll() {
    return api.get("/branch/getAll", { requiresAuth: true });
  },
  create(data) {
    return api.post("/branch/create", data, { requiresAuth: true });
  },
  update(id, data) {
    return api.put(`/branch/update/${id}`, data, { requiresAuth: true });
  },
  delete(id) {
    return api.delete(`/branch/delete/${id}`, { requiresAuth: true });
  },
};

export default branchApi;
