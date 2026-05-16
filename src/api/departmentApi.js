import api from "./axiosInstance";

const departmentApi = {
  getAll(params = {}) {
    return api.get("/department/getAll", { params, requiresAuth: true });
  },
  create(data) {
    return api.post("/department/createDepartment", data, { requiresAuth: true });
  },
  update(id, data) {
    return api.put(`/department/update/${id}`, data, { requiresAuth: true });
  },
  delete(id) {
    return api.delete(`/department/delete/${id}`, { requiresAuth: true });
  },
};

export default departmentApi;
