import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice";
import attendanceReducer from "./slice/attendanceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
  },
});