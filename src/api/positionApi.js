import api from "./axiosInstance";

const positionApi = {
  getAll() {
    return api.get("/department/getAllPositions", { requiresAuth: true });
  },
  create(data) {
    return api.post("/department/createPosition", data, { requiresAuth: true });
  },
  update(id, data) {
    return api.put(`/department/updatePosition/${id}`, data, { requiresAuth: true });
  },
  delete(id) {
    return api.delete(`/department/deletePosition/${id}`, { requiresAuth: true });
  },
};

export default positionApi;
