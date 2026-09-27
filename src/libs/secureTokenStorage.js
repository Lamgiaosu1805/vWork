import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

export const getRefreshToken = () =>
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const setAccessToken = (value) =>
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, value);

export const setRefreshToken = (value) =>
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, value);

export const removeAccessToken = () =>
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);

export const removeRefreshToken = () =>
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

export const clearTokens = () =>
    Promise.all([removeAccessToken(), removeRefreshToken()]);
