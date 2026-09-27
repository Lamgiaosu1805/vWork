import axios from "axios";
import { store } from "../redux/store";
import { setAccessToken, logoutUser } from "../redux/slice/authSlice";
import utils from "../helpers/utils";
import * as secureTokenStorage from "../libs/secureTokenStorage";

const api = axios.create({
    baseURL: utils.BASE_URL,
    timeout: 15000,
});

const generateRequestId = () =>
    `req_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

api.interceptors.request.use(
    async (config) => {
        config.headers = {
            ...config.headers,
            "x-request-id": generateRequestId(),
        };

        if (!config.requiresAuth) return config;

        const { auth } = store.getState();
        let accessToken = auth?.accessToken;

        if (!accessToken) {
            accessToken = await secureTokenStorage.getAccessToken();
        }

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let refreshPromise = null;

const performRefresh = async () => {
    try {
        const refreshToken = await secureTokenStorage.getRefreshToken();
        if (!refreshToken) {
            throw new Error("NO_REFRESH_TOKEN");
        }

        const res = await axios.post(`${utils.BASE_URL}/auth/refreshToken`, {
            refreshToken,
        });

        const newAccessToken = res.data?.accessToken;
        const newRefreshToken = res.data?.refreshToken;
        if (!newAccessToken) {
            throw new Error("NO_ACCESS_TOKEN");
        }

        store.dispatch(setAccessToken(newAccessToken));
        await secureTokenStorage.setAccessToken(newAccessToken);
        await secureTokenStorage.setRefreshToken(newRefreshToken);

        return newAccessToken;
    } finally {
        refreshPromise = null;
    }
};

const refreshAccessToken = () => {
    if (!refreshPromise) {
        refreshPromise = performRefresh();
    }
    return refreshPromise;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            return Promise.reject(error);
        }

        const shouldRefresh =
            error.response.status === 401 &&
            error.response.data.errorCode === "TOKEN_EXPIRED" &&
            !originalRequest._retry &&
            originalRequest.requiresAuth;

        if (!shouldRefresh) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (err) {
            store.dispatch(logoutUser());
            await secureTokenStorage.clearTokens();
            return Promise.reject(err);
        }
    }
);

export default api;
