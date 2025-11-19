import { pushLichCong } from "../redux/slice/attendanceSlice";
import api from "./axiosInstance";
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import localeData from 'dayjs/plugin/localeData';
dayjs.extend(localeData);

const attendanceApi = {
    checkIn(payload) {
        return api.post('attendance/checkIn', payload, { requiresAuth: true });
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
    }
}

export default attendanceApi