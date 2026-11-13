import api from "../../../api/axiosInstance";

const appUpdateApi = {
  getRelease: ({ platform, version }) => api.get("/app-release", { params: { platform, version } }),
};

export default appUpdateApi;
