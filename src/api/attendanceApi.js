import { checkOut, pushLichCong, setCurrentWorkSheetAttendance } from "../redux/slice/attendanceSlice";
import api from "./axiosInstance";
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import localeData from 'dayjs/plugin/localeData';
dayjs.extend(localeData);
import WifiManager from 'react-native-wifi-reborn';
import * as Location from 'expo-location';
import { ensureLocationPermission } from '../helpers/location';
import Toast from "react-native-toast-message";
import { Alert } from "react-native";

const attendanceApi = {
    checkIn(payload) { //Cần improve lại
        return api.post('attendance/checkIn', payload, { requiresAuth: true });
    },
    async checkOut(dispatch, currentWorkSheet) {
        const shifts = currentWorkSheet?.shifts || [];

        if (!shifts.length) {
            return Alert.alert("Lỗi", "Không tìm thấy thông tin ca làm việc");
        }

        // Lấy ca có start_time nhỏ nhất
        const earliestShift = shifts.reduce((a, b) =>
            a.start_time < b.start_time ? a : b
        );

        // Lấy ca có end_time lớn nhất
        const latestShift = shifts.reduce((a, b) =>
            a.end_time > b.end_time ? a : b
        );

        const startTime = earliestShift.start_time;
        const endTime = latestShift.end_time;

        const workDate = dayjs(currentWorkSheet.date);
        const endDateTime = dayjs(`${workDate.format("YYYY-MM-DD")} ${endTime}`);

        const now = dayjs();
        const isEarly = now.isBefore(endDateTime);

        return Alert.alert(
            isEarly ? "Bạn đang checkout sớm" : "Xác nhận check out",
            isEarly
                ? `Giờ kết thúc ca: ${endTime}. Bạn có chắc muốn checkout không?`
                : "Bạn có chắc chắn muốn check out không?",
            [
                {
                    text: "Huỷ",
                    style: "cancel",
                    onPress: () => { },
                },
                {
                    text: "OK",
                    onPress: () => _doCheckout(dispatch),
                }
            ]
        );
    },
    async getCurrentWorkSheet(dispatch) {
        try {
            const res = await api.get('attendance/getWorkSheet', { requiresAuth: true });
            const todayWorkSheet = res.data?.data?.length > 0 ? res.data.data[0] : null;
            dispatch(setCurrentWorkSheetAttendance(todayWorkSheet));
            return todayWorkSheet;
        } catch (error) {
            console.log("getCurrentWorkSheet error:", error.response?.data || error.message);
        }
    },
    async getLichCong(dispatch, period, congThang) {
        try {
            const res = await api.get(`attendance/getLichCong?period=${period || 0}`, { requiresAuth: true });

            const dataMap = (res.data?.data || []).reduce((acc, item) => {
                const dateKey = dayjs(item.date).format('YYYY-MM-DD');
                acc[dateKey] = item;
                return acc;
            }, {});
            dispatch(pushLichCong({
                congThang,
                data: dataMap
            }));
        } catch (error) {
            console.log("getLichCong error:", error.response?.data || error.message);
        }
    },
    getMyPayrollStats(month, year) {
        return api.get('attendance/my-payroll-stats', {
            requiresAuth: true,
            params: { month, year },
        });
    },
}

export default attendanceApi

const _doCheckout = async (dispatch) => {
    try {
        const granted = await ensureLocationPermission();
        if (!granted) return;
        const ssid = await WifiManager.getCurrentWifiSSID();
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const res = await api.post(
            "attendance/checkOut",
            { ssid, latitude, longitude },
            { requiresAuth: true }
        );

        Toast.show({
            type: "success",
            text1: "Thông báo",
            text2: res.data.message || "Check out thành công!",
        });

        dispatch(checkOut({
            checkOut: res.data.check_out,
            minutesEarly: res.data.minute_early
        }));

    } catch (error) {
        console.log("checkOut error:", error.response?.data || error.message);

        Toast.show({
            type: "error",
            text1: "Thông báo",
            text2: error.response?.data?.message || error.message,
        });
    }
}