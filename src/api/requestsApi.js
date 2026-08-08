import api from "./axiosInstance";

const requestsApi = {
  getStatisticsRequests: () => {
    return api.get("/attendance/stats", { requiresAuth: true });
  },

  createRequest: (payload) => {
    return api.post("/requests", payload, { requiresAuth: true });
  },

  getEligibleReviewers: () => {
    return api.get("/requests/eligible-reviewers", { requiresAuth: true });
  },

  getMyRequests: (params) =>
    api.get("/requests/my", {
      requiresAuth: true,
      params,
    }),

  cancelLeaveRequest: (requestId) =>
    api.patch(
      `/requests/cancel/${requestId}`,
      {},
      {
        requiresAuth: true,
      },
    ),

  getRequests: (params) =>
    api.get("/requests", {
      requiresAuth: true,
      params,
    }),

  getRequestById: (requestId) =>
    api.get(`/requests/${requestId}`, { requiresAuth: true }),

  reviewRequest: (requestId, payload) =>
    api.patch(`/requests/review/${requestId}`, payload, {
      requiresAuth: true,
    }),
};

export default requestsApi;
