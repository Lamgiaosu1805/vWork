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
        logoutUser: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
        },
    }
})


export const { setCredentials, setAccessToken, logoutUser } = authSlice.actions;
export default authSlice.reducer;