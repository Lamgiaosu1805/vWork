import api from "../../../api/axiosInstance";

const authApi = {
  login: (username, password) => api.post("/auth/login", { username, password }),
  getUserInfoWithToken: (token) =>
    api.get("/user/getUserInfo", { headers: { Authorization: `Bearer ${token}` } }),
  changeFirstPassword: (tempToken, newPassword) =>
    api.post(
      "/auth/changeFirstPassword",
      { newPassword },
      { headers: { Authorization: `Bearer ${tempToken}` } },
    ),
  changePassword: (currentPassword, newPassword) =>
    api.post(
      "/auth/changePassword",
      { currentPassword, newPassword },
      { requiresAuth: true },
    ),
};

export default authApi;
