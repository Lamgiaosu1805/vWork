import api from "./axiosInstance";

export const registerDeviceTokenApi = ({ fcm_token, platform, device_id }) => {
    return api.post(
        "/notification/device-token",
        { fcm_token, platform, device_id },
        { requiresAuth: true }
    );
};

export const unregisterDeviceTokenApi = ({ fcm_token }) => {
    return api.delete("/notification/device-token", {
        requiresAuth: true,
        data: { fcm_token },
    });
};

export const sendTestNotificationApi = ({ title, body, data = {} }) => {
    return api.post(
        "/notification/test",
        { title, body, data },
        { requiresAuth: true }
    );
};

export const getNotificationsApi = (page = 1, limit = 20) => {
    return api.get("/notification", {
        params: { page, limit },
        requiresAuth: true,
    });
};

export const getUnreadCountApi = () => {
    return api.get("/notification/unread-count", { requiresAuth: true });
};

export const markNotificationReadApi = (id) => {
    return api.patch(`/notification/${id}/read`, {}, { requiresAuth: true });
};

export const markAllNotificationsReadApi = () => {
    return api.patch("/notification/read-all", {}, { requiresAuth: true });
};
