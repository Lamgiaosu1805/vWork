import api from "../../../api/axiosInstance";

const profileApi = {
  getProfile: (userId) => api.get(`/user/profile/${userId}`, { requiresAuth: true }),
};

export default profileApi;
