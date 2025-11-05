import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../redux/store";
import { setAccessToken, logoutUser } from "../redux/slice/authSlice";
import utils from "../helpers/utils";

const api = axios.create({
    baseURL: utils.BASE_URL,
    timeout: 15000,
});

/**
 * Request Interceptor
 * - Chỉ thêm Authorization nếu `config.requiresAuth = true`
 * - Cho phép thêm header tùy chọn qua `config.headers`
 */
api.interceptors.request.use(
    async (config) => {
        // Nếu API không yêu cầu token thì bỏ qua
        if (!config.requiresAuth) return config;

        const { auth } = store.getState();
        let accessToken = auth?.accessToken;

        // Nếu Redux chưa có token
        if (!accessToken) {
            accessToken = await AsyncStorage.getItem("accessToken");
        }
        if (accessToken) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${accessToken}`,
            };
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 *  Response Interceptor
 * - Tự động refresh token nếu 401 (accessToken hết hạn)
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu không có response (mất mạng, timeout)
        if (!error.response) {
            return Promise.reject(error);
        }

        // Nếu token hết hạn
        if (error.response.status === 401 && !originalRequest._retry && originalRequest.requiresAuth) {
            originalRequest._retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem("refreshToken");

                if (!refreshToken) {
                    store.dispatch(logoutUser());
                    return Promise.reject(error);
                }

                // Gọi API refresh
                const res = await axios.post(`${utils.BASE_URL}/auth/refreshToken`, { refreshToken });

                const newAccessToken = res.data?.accessToken;
                const newRefreshToken = res.data?.refreshToken
                if (!newAccessToken) throw new Error("Không có accessToken mới");

                // Lưu lại Redux + AsyncStorage
                store.dispatch(setAccessToken(newAccessToken));
                await AsyncStorage.setItem("accessToken", newAccessToken);
                await AsyncStorage.setItem("refreshToken", newRefreshToken);

                // Retry request gốc
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (err) {
                store.dispatch(logoutUser());
                await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default api;