import { Alert, Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import { openDrawer } from '../../helpers/navigationRef';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import attendanceApi from '../../api/attendanceApi';
import WifiManager from 'react-native-wifi-reborn';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import utils from '../../helpers/utils';
import { Bell, Calendar, ChevronLeft, ChevronRight, Menu } from 'lucide-react-native';
import useTheme from '../../assets/theme/useTheme';
import { Images } from '../../assets/images';
import { COLORS } from '../../assets/theme/colors';

dayjs.locale('vi');

const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const getAttendanceRangePayroll = (year, month) => {
    const start = dayjs(`${year}-${month}-01`).subtract(1, "month").date(26);
    const end = dayjs(`${year}-${month}-01`).date(25);

    const days = [];
    let current = start;

    while (current.isSame(end) || current.isBefore(end)) {
        const day = current.date();
        const monthNum = current.month() + 1;
        days.push({
            full: current.format("YYYY-MM-DD"),
            date: day === 1 ? `1/${monthNum}` : `${day}`,
            dow: current.day(),
            weekday: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][current.day()]
        });

        current = current.add(1, "day");
    }

    return days;
};

// Hàm xác định màu dấu chấm
const getDotColor = (day, lichCongList, statMonth, statYear) => {
    const today = dayjs();
    const dayDate = dayjs(day.full);

    if (dayDate.isAfter(today, 'day')) return '#FFFFFF'; // chưa tới → chấm trắng
    if (day.dow === 0) return '#3498DB'; // CN → xanh dương

    // Tìm công tháng hiện tại
    const currentCongThang = lichCongList.find(
        (lc) => lc.congThang === `${statMonth}-${statYear}`
    );

    if (!currentCongThang || !currentCongThang.data) {
        // Nếu chưa có dữ liệu tháng này
        return '#FF0000';
    }

    const dayData = currentCongThang.data[day.full];
    // if (!dayData) return '#FF0000'; // chưa chấm công → đỏ
    // Kiểm tra trạng thái
    const checkIn = dayData?.check_in;
    const checkOut = dayData?.check_out;
    if (!checkIn && !checkOut) {
        return '#FF0000'; // Đỏ (Nghỉ không phép)
    }
    if (checkIn && checkOut) {
        return '#00A896';
    }
    return '#FFD700';
};

const statusStyles = StyleSheet.create({
    statusBox: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 12,
        justifyContent: 'space-between',
        minHeight: 120,
        alignItems: 'center',
    },
    statusValue: { fontSize: 24, color: '#000000', marginVertical: 20, fontWeight: '600' },
    statusTitle: { fontSize: 13, color: COLORS.text.bland, fontWeight: '500' },
    statusLabelText: { fontSize: 11, fontWeight: '400' },
});

const InlineStatusBox = ({ title, value, statusLabel, statusColor, showClockIcon = false }) => (
    <View style={statusStyles.statusBox}>
        <Text style={statusStyles.statusTitle}>{title}</Text>
        <Text style={statusStyles.statusValue}>{value}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[statusStyles.statusLabelText, { color: statusColor }]}>
                {statusLabel}
            </Text>
        </View>
    </View>
);

const calcWorkingHours = (ws) => {
    if (!ws?.check_in || !ws?.check_out) return "-:-";

    const checkIn = dayjs(ws.check_in);
    const checkOut = dayjs(ws.check_out);

    let totalMinutes = checkOut.diff(checkIn, "minute");

    // Điều kiện trừ nghỉ trưa:
    // - mergedShift = true
    // - checkout sau 1 giờ chiều
    if (ws?.mergedShift === true) {
        const lunchStart = checkIn.hour(12).minute(0).second(0);
        const lunchEnd = checkIn.hour(13).minute(0).second(0);

        // Nếu checkout sau 13:00 thì trừ 1 tiếng
        if (checkOut.isAfter(lunchEnd)) {
            totalMinutes -= 60;
        }
    }

    if (totalMinutes <= 0) return "-:-";

    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');

    return `${h}:${m}`;
};

const renderFullStatusSection = (currentWorkSheet) => (
    <View style={{ marginTop: 12, }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 11 }}>
            <InlineStatusBox
                title="Giờ vào"
                value={utils.formatTime(currentWorkSheet?.check_in, false) || "-:-"}
                statusLabel={currentWorkSheet?.check_in ? 'Đã check in' : 'Chưa check in'}
                statusColor={!currentWorkSheet?.check_in ? '#FF0000' : '#00A896'}
            />
            <InlineStatusBox
                title="Giờ ra"
                value={utils.formatTime(currentWorkSheet?.check_out, false) || "-:-"}
                statusLabel={currentWorkSheet?.check_out ? 'Đã check out' : 'Chưa check out'}
                statusColor={!currentWorkSheet?.check_out ? '#FF0000' : '#00A896'}
            />
            <InlineStatusBox
                title="Số giờ làm"
                value={calcWorkingHours(currentWorkSheet)}
                statusLabel={""}
                statusColor={'#3498DB'}
                showClockIcon={true}
            />
        </View>
    </View>
);

const TimeDisplay = ({ IMAGE_HEIGHT }) => {
    const [currentTime, setCurrentTime] = useState(dayjs());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeDisplay = currentTime.format('HH:mm:ss');
    const rawDateDisplay = currentTime.format('dddd DD/MM/YYYY');
    const dateDisplay = capitalizeFirstLetter(rawDateDisplay);

    return useMemo(() => (
        <View style={styles.timeAndImageContainer}>
            <View style={styles.timeInfo}>
                <Text style={styles.currentTimeText}>{timeDisplay}</Text>
                <Text style={styles.currentDateText}>{dateDisplay}</Text>
            </View>
            <View style={styles.illustrationWrapper}>
                <Image
                    source={Images.DecoAttendance}
                    style={{ height: IMAGE_HEIGHT, width: null, aspectRatio: 178 / IMAGE_HEIGHT  }}
                    resizeMode="contain"
                />
            </View>
        </View>
    ), [timeDisplay, dateDisplay, IMAGE_HEIGHT]);
};

const checkIn = async () => {
    try {
        const ssid = await WifiManager.getCurrentWifiSSID();
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords
        try {
            const data = await attendanceApi.checkIn({
                ssid: ssid, latitude, longitude
            })
            Toast.show({
                type: "success",
                text1: "Thông báo",
                text2: data.data.message || 'Chấm công thành công!',
            });
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Thông báo",
                text2: error.response?.data.message || error.message,
            });
            console.log("Check in error:", error.response?.data || error.message);
        }
    } catch (error) {
        console.log('Lỗi lấy SSID/Location:', error?.message || error);
        Alert.alert(
            'Quyền vị trí bị tắt',
            'Ứng dụng cần quyền truy cập vị trí để lấy vị trí hiện tại và tên Wi-Fi. Mở cài đặt để bật lại?',
            [
                { text: 'Huỷ', style: 'cancel' },
                { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
            ],
        );
    }

}

function getCurrentPayrollMonth(today = dayjs()) {
    const day = today.date();
    let month = today.month() + 1; // 1-12
    let year = today.year();

    if (day >= 26) {
        month += 1;
        if (month === 13) {
            month = 1;
            year += 1;
        }
    }

    return { statMonth: month, statYear: year };
}

export default function AttendanceScreen() {
    const {colors} = useTheme();
    const IMAGE_HEIGHT = 199;
    const today = dayjs();

    // Tháng/ Năm thống kê hiện tại
    const { statMonth: initMonth, statYear: initYear } = getCurrentPayrollMonth();

    const [statMonth, setStatMonth] = useState(initMonth);
    const [statYear, setStatYear] = useState(initYear);
    const [showDetail, setShowDetail] = useState(false);
    const [days, setDays] = useState([]);
    const [period, setPeriod] = useState(0); // 0: hiện tại, -1: trước đó, 1: kế tiếp
    const dispatch = useDispatch();

    const attendance = useSelector(state => state.attendance);
    const { currentWorkSheet, lichCong } = attendance

    // console.log("cws",currentWorkSheet)

    // console.log(JSON.stringify(lichCong, null, 2));

    // Cập nhật days khi statMonth/statYear thay đổi
    useEffect(() => {
        setDays(getAttendanceRangePayroll(statYear, statMonth));
    }, [statMonth, statYear]);

    // Xác định có thể forward hay không
    const canForward = () => {
        const nextMonthStart = dayjs(`${statYear}-${statMonth}-26`);
        return today.isSame(nextMonthStart, 'day') || today.isAfter(nextMonthStart, 'day');
    };

    const getLichCong = async (currentPeriod, month, year) => {
        try {
            await attendanceApi.getLichCong(dispatch, currentPeriod, `${month}-${year}`);
            setPeriod(currentPeriod);
        } catch (error) {
            console.log(error)
        }
    }

    // Back
    const handleBack = () => {
        let newMonth = statMonth - 1;
        let newYear = statYear;

        if (newMonth === 0) {
            newMonth = 12;
            newYear -= 1;
        }

        setStatMonth(newMonth);
        setStatYear(newYear);
        getLichCong(period - 1, newMonth, newYear);
    };

    // Forward
    const handleForward = () => {
        if (!canForward()) return;

        let newMonth = statMonth + 1;
        let newYear = statYear;

        if (newMonth === 13) {
            newMonth = 1;
            newYear += 1;
        }

        setStatMonth(newMonth);
        setStatYear(newYear);
        getLichCong(period + 1, newMonth, newYear);
    };

    // Hiển thị thông tin chấm công khi ấn vào ngày
    const handleDayPress = (day) => {
        try {
            const dayDate = dayjs(day.full);
            const congThangKey = `${statMonth}-${statYear}`;
            const currentCongThang = lichCong?.find(lc => lc.congThang === congThangKey);
            const workSheet = currentCongThang?.data?.[day.full];

            const isFuture = dayDate.isAfter(today, 'day');
            const isSunday = dayDate.day() === 0;

            let formattedDateRaw = dayDate.locale('vi').format('dddd, DD/MM/YYYY');
            let title = capitalizeFirstLetter(formattedDateRaw);
            let message = '';

            const getShiftName = (ws) => {
                const shifts = ws?.shifts;
                if (!shifts || shifts.length === 0) return 'Không rõ ca';
                if (shifts.length >= 2) return 'Ca hành chính';
                return shifts[0].name || 'Không tên ca';
            };

            if (isSunday && (!workSheet || workSheet.status === 'off')) {
                message = 'Ngày nghỉ cuối tuần (Chủ Nhật).';
                Alert.alert(title, message);
                return;
            }

            if (isFuture) {
                if (workSheet) {
                    const shiftName = getShiftName(workSheet);
                    const start = workSheet.shifts && workSheet.shifts[0]?.start_time;
                    const end = workSheet.shifts && workSheet.shifts[0]?.end_time;
                    message = `Đã xếp ca: ${shiftName}`;
                    if (start && end) {
                        message += `\n(Từ ${utils.formatTime(start, true)} đến ${utils.formatTime(end, true)})`;
                    }
                } else {
                    message = 'Chưa có ca làm việc nào được xếp cho ngày này.';
                }
            } else {
                // Ngày đã qua hoặc hôm nay
                if (workSheet) {
                    const shiftName = getShiftName(workSheet);
                    const checkInTime = workSheet.check_in ? utils.formatTime(workSheet.check_in, true) : 'Chưa Check-in';
                    const checkOutTime = workSheet.check_out ? utils.formatTime(workSheet.check_out, true) : 'Chưa Check-out';
                    const minutesLate = workSheet.minutes_late ? parseInt(workSheet.minutes_late, 10) : 0;
                    const minutesEarly = workSheet.minute_early ? parseInt(workSheet.minute_early, 10) : 0;


                    if (workSheet.status === 'off') {
                        message = 'Ngày nghỉ có kế hoạch (Ví dụ: Nghỉ phép, ốm...).';
                    } else {
                        message = `Ca: ${shiftName}\n`;

                        if (!workSheet.check_in && !workSheet.check_out) {
                            message += `\nTrạng thái: NGHỈ KHÔNG PHÉP`;
                        } else if (!workSheet.check_in || !workSheet.check_out) {
                            message += `Vào: ${checkInTime}\n`;
                            message += `Ra: ${checkOutTime}`;
                            message += `\nTrạng thái: Thiếu chấm công.`;
                        } else {
                            message += `Vào: ${checkInTime}\n`;
                            message += `Ra: ${checkOutTime}`;
                            message += `\nTrạng thái: Hoàn thành.`;
                        }

                        if (minutesLate > 0) {
                            message += `\nĐã muộn: ${minutesLate} phút 😆`;
                        }
                        if (minutesEarly > 0) {
                            message += `\nĐã về sớm: ${minutesEarly} phút 😆`;
                        }
                    }
                } else {
                    message = 'Không có thông tin ca làm việc nào được ghi nhận.\nTrạng thái: NGHỈ KHÔNG PHÉP hoặc cần báo cáo bổ sung.';
                }
            }

            Alert.alert(title, message);
        } catch (e) {
            console.log('handleDayPress error', e);
            Alert.alert('Lỗi', 'Không thể lấy thông tin ngày này');
        }
    };

    const disableCheckIn =
    currentWorkSheet?.check_in != null || currentWorkSheet?.check_out != null;
      
    return (
        <View style={[styles.container, {backgroundColor: colors.main}]}>
            <Header
                title="Chấm công"
                LeftIcon={Menu}
                onLeftPress={() => openDrawer()}
                RightIcon={Bell}
                onRightPress={() => Alert.alert('Notifications Pressed')}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 25, paddingBottom: 30 }}
            >
                <TimeDisplay IMAGE_HEIGHT={IMAGE_HEIGHT} />

                <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
                    <TouchableOpacity disabled={disableCheckIn} style={[styles.checkButton, disableCheckIn && { backgroundColor: COLORS.Secondary }]} activeOpacity={0.7} onPress={() => { checkIn() }}>
                        <Text style={styles.checkButtonText}>CHECK IN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity disabled={currentWorkSheet?.check_out != null} style={[styles.checkButton, currentWorkSheet?.check_out != null && { backgroundColor: COLORS.Secondary }]} activeOpacity={0.7} onPress={() => attendanceApi.checkOut(dispatch, currentWorkSheet)}>
                        <Text style={styles.checkButtonText}>CHECK OUT</Text>
                    </TouchableOpacity>
                </View>

                {renderFullStatusSection(currentWorkSheet)}

                {/* Bảng công */}
                <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 16, color: COLORS.black, fontWeight: '600' }}>Bảng công của tôi</Text>
                    <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 16, marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '500', fontSize: 16, color: COLORS.neutral.neutral700 }}>
                                Thống kê T{statMonth}, {statYear}
                            </Text>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity activeOpacity={0.7} onPress={handleBack}>
                                    <ChevronLeft size={20} color={COLORS.black} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={{ marginLeft: 24 }}
                                    onPress={handleForward}
                                >
                                    <ChevronRight size={20} color={canForward() ? COLORS.black : "#B9B9B9"} />
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.7} style={{ marginLeft: 34 }}>
                                    <Calendar size={20} color={COLORS.black}/>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ marginTop: 16, height: 169, width: '100%', flexDirection: 'row' }}>
                            <View style={{
                                flex: 1,
                                backgroundColor: COLORS.Tertiary,
                                borderRadius: 16,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <Ionicons name="calendar" size={50} color={COLORS.Primary} />
                                <Text style={{ marginTop: 4, fontSize: 12, color: '#4D4D4D' }}>Số công thực tế</Text>
                                <Text style={{ marginTop: 4, fontSize: 20, color: '#4D4D4D', fontWeight: '500' }}>12/24</Text>
                            </View>
                            <View style={{ width: 24, backgroundColor: 'white' }} />
                            <View style={{
                                flex: 1,
                                backgroundColor: COLORS.Tertiary,
                                borderRadius: 16,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <Ionicons name="time" size={50} color={COLORS.Primary}  />
                                <Text style={{ marginTop: 4, fontSize: 12, color: '#4D4D4D' }}>Số giờ làm thực tế</Text>
                                <Text style={{ marginTop: 4, fontSize: 20, color: '#4D4D4D', fontWeight: '500' }}>12/24</Text>
                            </View>
                        </View>

                        {!showDetail && (
                            <TouchableOpacity
                                style={{ alignSelf: 'center', padding: 8, marginTop: 8 }}
                                activeOpacity={0.7}
                                onPress={() => setShowDetail(true)}
                            >
                                <Text style={{ fontSize: 16, color: '#3B82F6', fontWeight: '500' }}>
                                    Xem chi tiết
                                </Text>
                            </TouchableOpacity>
                        )}

               {showDetail && (
                    <View style={calStyles.wrapper}>

                        {/* Legend */}
                        <View style={calStyles.legendRow}>
                        {[
                            { color: '#00A896', label: 'Đủ công' },
                            { color: '#FFD700', label: 'Thiếu chấm' },
                            { color: '#FF4D4F', label: 'Nghỉ/vắng' },
                            { color: '#3B82F6', label: 'Chủ nhật' },
                        ].map(({ color, label }) => (
                            <View key={label} style={calStyles.legendItem}>
                            <View style={[calStyles.legendDot, { backgroundColor: color }]} />
                            <Text style={calStyles.legendText}>{label}</Text>
                            </View>
                        ))}
                        </View>

                        {/* Day cells */}
                        <View style={calStyles.grid}>
                        {days.map((d, index) => {
                            const dotColor = getDotColor(d, lichCong, statMonth, statYear);
                            const isToday   = dayjs(d.full).isSame(dayjs(), 'day');
                            const isSunday  = d.dow === 0;
                            const isFuture  = dayjs(d.full).isAfter(dayjs(), 'day');

                            return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => handleDayPress(d)}
                                style={[
                                calStyles.cell,
                                isSunday  && calStyles.cellSunday,
                                isFuture  && calStyles.cellFuture,
                                isToday   && calStyles.cellToday,
                                ]}
                            >
                                {/* Thứ */}
                                <Text style={[
                                calStyles.dowText,
                                isSunday && { color: '#3B82F6' },
                                ]}>
                                {d.weekday}
                                </Text>

                                {/* Ngày */}
                                <Text style={[
                                calStyles.dayNum,
                                isToday  && { color: COLORS.Primary },
                                isSunday && { color: '#3B82F6' },
                                ]}>
                                {d.date}
                                </Text>

                                {/* Chấm trạng thái */}
                                <View style={[calStyles.dot, { backgroundColor: dotColor }]} />
                            </TouchableOpacity>
                            );
                        })}
                        </View>

                        {/* Thu gọn */}
                        <TouchableOpacity
                        style={calStyles.collapseBtn}
                        activeOpacity={0.7}
                        onPress={() => setShowDetail(false)}
                        >
                        <ChevronLeft
                            size={14}
                            color={COLORS.Primary}
                            style={{ transform: [{ rotate: '90deg' }], marginRight: 4 }}
                        />
                        <Text style={calStyles.collapseText}>Thu gọn</Text>
                        </TouchableOpacity>

                    </View>
                )}

                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1,  },
    timeAndImageContainer: {
        height: 150,
        width: '100%',
        backgroundColor: COLORS.Tertiary,
        marginTop: 13,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    timeInfo: { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'flex-start', paddingRight: 8, paddingLeft: 20 },
    currentTimeText: { fontSize: 28, fontWeight: '600', color: COLORS.text.dark,  marginBottom: 5 },
    currentDateText: { fontSize: 13, fontWeight: '500', color: COLORS.text.dark},
    illustrationWrapper: {top: 199 * (8 / 199) },
    checkButton: { flex: 1, height: 71, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.Primary, borderRadius: 9999 },
    checkButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
});

const calStyles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  cell: {
    width: '18.5%',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellSunday: {
    backgroundColor: '#EFF6FF',
  },
  cellFuture: {
    opacity: 0.5,
  },
  cellToday: {
    borderColor: COLORS.Primary,   
    backgroundColor: '#FFF5F5',
  },
  dowText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 1,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  collapseText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.Primary,
  },
});