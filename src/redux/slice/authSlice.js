import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
};
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, accessToken, refreshToken } = action.payload;
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
        },
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
        },
        updateUserFields: (state, action) => {
            if (!state.user) return;
            state.user = {
                ...state.user,
                ...action.payload,
            };
        },
        logoutUser: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
        },
    }
})


export const { setCredentials, setAccessToken, updateUserFields, logoutUser } = authSlice.actions;
export default authSlice.reducer;