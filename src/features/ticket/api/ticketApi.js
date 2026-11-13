import api from "../../../api/axiosInstance";
import utils from "../../../helpers/utils";

const MULTIPART = {
  requiresAuth: true,
  headers: { "Content-Type": "multipart/form-data" },
  timeout: 120000,
};

// Request có file: JSON đi trong field "payload", file ở field "files"; loại giấy tờ của từng file nằm ở
// payload.fileKinds theo đúng thứ tự file.
const toFormData = (payload, files = []) => {
  const formData = new FormData();
  formData.append(
    "payload",
    JSON.stringify({ ...payload, fileKinds: files.map((file) => file.kind ?? "other") }),
  );
  files.forEach((file) => {
    formData.append("files", { uri: file.uri, name: file.name, type: file.mimeType });
  });
  return formData;
};

const ticketApi = {
  getMeta: async () => api.get("/tickets/meta", { requiresAuth: true }),
  getCounts: async () => api.get("/tickets/counts", { requiresAuth: true }),
  getTickets: async ({
    tab,
    scope,
    status,
    productId,
    categoryId,
    templateId,
    urgency,
    ownerId,
    q,
    from,
    to,
    page,
    limit,
  }) =>
    api.get("/tickets", {
      requiresAuth: true,
      params: {
        tab,
        scope,
        status,
        productId,
        categoryId,
        templateId,
        urgency,
        ownerId,
        q,
        from,
        to,
        page,
        limit,
      },
    }),
  getTicketDetail: async (id) => api.get(`/tickets/${id}`, { requiresAuth: true }),
  searchTickets: async (q) => api.get("/tickets/search", { requiresAuth: true, params: { q } }),
  searchEmployees: async (q, { assignable = false, limit = 20 } = {}) =>
    api.get("/tickets/directory/employees", {
      requiresAuth: true,
      params: { q, limit, ...(assignable && { assignable: 1 }) },
    }),
  getDepartments: async () => api.get("/tickets/directory/departments", { requiresAuth: true }),

  createTicket: async ({ payload, files }) =>
    api.post("/tickets", toFormData(payload, files), MULTIPART),
  addMessage: async ({ id, payload, files }) =>
    api.post(`/tickets/${id}/messages`, toFormData(payload, files), MULTIPART),
  submitInfo: async ({ id, payload, files }) =>
    api.post(`/tickets/${id}/submit-info`, toFormData(payload, files), MULTIPART),

  // Các thao tác đổi trạng thái / giao việc: POST /tickets/:id/<action> với body JSON (kèm version)
  runAction: async ({ id, action, body = {} }) =>
    api.post(`/tickets/${id}/${action}`, body, { requiresAuth: true }),
  // DELETE không có body nên version đi theo query string
  removeCollaborator: async ({ id, employeeId, version }) =>
    api.delete(`/tickets/${id}/collaborators/${employeeId}`, {
      requiresAuth: true,
      params: { version },
    }),

  attachmentUrl: (id, attachmentId) =>
    `${utils.BASE_URL}/tickets/${id}/attachments/${attachmentId}/download`,
};

export default ticketApi;
