import api from "../../../api/axiosInstance";

const attendanceApi = {
  checkIn: (payload) =>
    api.post("attendance/checkIn", payload, { requiresAuth: true }),
  checkOut: (payload) =>
    api.post("attendance/checkOut", payload, { requiresAuth: true }),
  getWorkSheet: () => api.get("attendance/getWorkSheet", { requiresAuth: true }),
  getLichCong: () => api.get("attendance/getLichCong", { requiresAuth: true }),
  getMyPayrollStats: (month, year) =>
    api.get("attendance/my-payroll-stats", {
      requiresAuth: true,
      params: { month, year },
    }),
};

export default attendanceApi;
