import api from './axiosInstance';

export default {
    // ── Internal Files ───────────────────────────────────────────────────────
    getAccessibleDepts: () =>
        api.get('/internal-files/departments', { requiresAuth: true }),

    getDeptFolders: (deptId, parentId) =>
        api.get(`/internal-files/${deptId}/folders`, {
            params: { parent_id: parentId ?? null },
            requiresAuth: true,
        }),

    createFolder: (deptId, name, parentId) =>
        api.post(`/internal-files/${deptId}/folders`, { name, parent_id: parentId ?? null }, { requiresAuth: true }),

    deleteFolder: (deptId, folderId) =>
        api.delete(`/internal-files/${deptId}/folders/${folderId}`, { requiresAuth: true }),

    getDeptFiles: (deptId, folderId) =>
        api.get(`/internal-files/${deptId}/files`, {
            params: { folder_id: folderId ?? null },
            requiresAuth: true,
        }),

    uploadDeptFile: (deptId, formData) =>
        api.post(`/internal-files/${deptId}/upload`, formData, {
            requiresAuth: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    deleteFile: (fileId) =>
        api.delete(`/internal-files/file/${fileId}`, { requiresAuth: true }),

    // ── Weekly Reports ───────────────────────────────────────────────────────
    getMyDeptReport: () =>
        api.get('/weekly-reports/my-dept', { requiresAuth: true }),

    submitReport: (deptId, formData) =>
        api.post(`/weekly-reports/${deptId}/submit`, formData, {
            requiresAuth: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    getReportHistory: (deptId, params) =>
        api.get(`/weekly-reports/${deptId}/history`, { params, requiresAuth: true }),

    getAdminReports: () =>
        api.get('/weekly-reports/admin', { requiresAuth: true }),
};
