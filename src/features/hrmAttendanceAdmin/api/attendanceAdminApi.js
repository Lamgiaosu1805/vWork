import api from "../../../api/axiosInstance";

const attendanceAdminApi = {
  getAllowedWifiLocations: () =>
    api.get("/attendance/getAllowedWifiLocations", { requiresAuth: true }),
  getAllWorkSheets: (date) =>
    api.get("/attendance/getAllWorkSheets", {
      requiresAuth: true,
      params: { date },
    }),
};

export default attendanceAdminApi;
