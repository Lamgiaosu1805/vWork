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
        },
        checkIn: (state, action) => {
            // state.currentWorkSheet  action.payload;
        },
        checkOut: (state, action) => {
            state.currentWorkSheet.check_out = action.payload.checkOut
            state.currentWorkSheet.minute_early = action.payload.minutesEarly
        }
    }
})


export const { setCurrentWorkSheetAttendance, pushLichCong, checkOut } = authSlice.actions;
export default authSlice.reducer;