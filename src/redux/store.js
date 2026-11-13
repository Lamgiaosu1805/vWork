import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice";
import chatReducer from "./slice/chatSlice";
import handbookAssistantReducer from "../features/handbookAssistant/store/handbookAssistantSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    handbookAssistant: handbookAssistantReducer,
  },
});
