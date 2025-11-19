import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentWorkSheet: null,
    lichCong: [],
};
const authSlice = createSlice({
    name: "attendance",
    initialState,
    reducers: {
        setCurrentWorkSheetAttendance: (state, action) => {
            state.currentWorkSheet = action.payload;
        },
        pushLichCong: (state, action) => {
            const newItem = action.payload;

            const index = state.lichCong.findIndex(item => item.congThang === newItem.congThang);

            if (index !== -1) {
                state.lichCong[index] = newItem;
            } else {
                state.lichCong.push(newItem);
            }
        }
    }
})


export const { setCurrentWorkSheetAttendance, pushLichCong } = authSlice.actions;
export default authSlice.reducer;