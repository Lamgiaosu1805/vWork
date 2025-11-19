import { Alert, Image, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
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

dayjs.locale('vi');

const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const mockTodayData = {
    gioVao: '08 : 03',
    gioRa: '-:-',
    soGioLam: '05 : 28',
    isCheckIn: true,
    isCheckOut: false,
    lateMinutes: '00:00',
    isLate: false,
};

const getAttendanceRange = (year, month) => {
    const start = dayjs(`${year}-${month}-01`).subtract(1, 'month').date(26);
    const end = dayjs(`${year}-${month}-25`);

    const weekdayMap = {
        0: "CN",
        1: "T2",
        2: "T3",
        3: "T4",
        4: "T5",
        5: "T6",
        6: "T7",
    };

    const days = [];
    let current = start;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
        const day = current.date();
        const monthNum = current.month() + 1;

        days.push({
            date: day === 1 ? `1/${monthNum}` : `${day}`, // nếu là ngày 1, thêm tháng
            weekday: weekdayMap[current.day()],
            full: current.format("YYYY-MM-DD"),
            dow: current.day(),
        });

        current = current.add(1, 'day');
    }

    return days;
};

// Hàm xác định màu dấu chấm
const getDotColor = (day) => {
    const today = dayjs();
    const dayDate = dayjs(day.full);

    if (dayDate.isAfter(today, 'day')) return '#FFFFFF'; // chưa tới → chấm trắng
    if (day.dow === 0) return '#3498DB'; // CN → xanh dương

    // Fake check-in/check-out
    const isCheckIn = Math.random() > 0.3;
    const isCheckOut = Math.random() > 0.5;

    if (isCheckIn && isCheckOut) return '#00A896'; // xanh lá
    if (isCheckIn || isCheckOut) return '#FFD700'; // vàng
    return '#FF0000'; // đỏ
};

const statusStyles = StyleSheet.create({
    statusBox: {
        flex: 1,
        backgroundColor: '#E0F2F2',
        borderRadius: 10,
        padding: 12,
        justifyContent: 'space-between',
        minHeight: 120,
        alignItems: 'flex-start',
    },
    statusValue: { fontSize: 24, color: '#000000', marginVertical: 16 },
    statusTitle: { fontSize: 12, color: '#374151', fontWeight: '500' },
    statusLabelText: { fontSize: 10 },
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

const renderFullStatusSection = () => (
    <View style={{ marginTop: 12, backgroundColor: 'white', borderRadius: 16, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <InlineStatusBox
                title="Giờ vào"
                value={mockTodayData.gioVao}
                statusLabel={mockTodayData.isCheckIn ? 'Đã check in' : 'Chưa check in'}
                statusColor={'#00A896'}
            />
            <View style={{ width: 10 }} />
            <InlineStatusBox
                title="Giờ ra"
                value={mockTodayData.gioRa}
                statusLabel={mockTodayData.isCheckOut ? 'Đã check out' : 'Chưa check out'}
                statusColor={'#FF0000'}
            />
            <View style={{ width: 10 }} />
            <InlineStatusBox
                title="Số giờ làm"
                value={mockTodayData.soGioLam}
                statusLabel={mockTodayData.lateMinutes + 'p'}
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
                    source={require('../../../assets/images/OBJECTS.png')}
                    style={{ height: IMAGE_HEIGHT, width: null, aspectRatio: 1.5 }}
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

export default function AttendanceScreen() {
    const IMAGE_HEIGHT = 134;
    const today = dayjs();

    // Tháng/ Năm thống kê hiện tại
    const [statMonth, setStatMonth] = useState(today.month() + 1); // 1-12
    const [statYear, setStatYear] = useState(today.year());
    const [showDetail, setShowDetail] = useState(false);
    const [days, setDays] = useState([]);
    const [period, setPeriod] = useState(0); // 0: hiện tại, -1: trước đó, 1: kế tiếp
    const dispatch = useDispatch();

    const attendance = useSelector(state => state.attendance);

    // Cập nhật days khi statMonth/statYear thay đổi
    useEffect(() => {
        setDays(getAttendanceRange(statYear, statMonth));
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
        if (newMonth < 1) { newMonth = 12; newYear -= 1; }
        setStatMonth(newMonth);
        setStatYear(newYear);
        getLichCong(period - 1, newMonth, newYear);
    };

    // Forward
    const handleForward = () => {
        if (!canForward()) return;
        let newMonth = statMonth + 1;
        let newYear = statYear;
        if (newMonth > 12) { newMonth = 1; newYear += 1; }
        setStatMonth(newMonth);
        setStatYear(newYear);
        getLichCong(period + 1, newMonth, newYear);
    };

    return (
        <View style={styles.container}>
            <Header
                title="Chấm công"
                leftIconName="menu"
                onLeftPress={() => openDrawer()}
                rightIconName="notifications"
                onRightPress={() => Alert.alert('Notifications Pressed')}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 }}
            >
                <TimeDisplay IMAGE_HEIGHT={IMAGE_HEIGHT} />

                <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity style={styles.checkButton} activeOpacity={0.7} onPress={() => { checkIn() }}>
                        <Text style={styles.checkButtonText}>CHECK IN</Text>
                    </TouchableOpacity>
                    <View style={{ width: 16 }} />
                    <TouchableOpacity style={styles.checkButton} activeOpacity={0.7}>
                        <Text style={styles.checkButtonText}>CHECK OUT</Text>
                    </TouchableOpacity>
                </View>

                <Text style={{
                    fontSize: 14,
                    color: '#B9B9B9',
                    fontStyle: 'italic',
                    fontWeight: '500',
                    marginTop: 16,
                    lineHeight: 20
                }}>
                    *Lưu ý: Giờ hành chính làm việc từ 08 giờ và kết thúc lúc 17 giờ, được phép chấm công muộn 5 phút so với giờ bắt đầu làm việc.
                </Text>

                {renderFullStatusSection()}

                {/* Bảng công */}
                <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 16, color: '#374151', fontWeight: '500' }}>Bảng công</Text>
                    <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 16, marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '500', fontSize: 16, color: '#374151' }}>
                                Thống kê T{statMonth}, {statYear}
                            </Text>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity activeOpacity={0.7} onPress={handleBack}>
                                    <Ionicons name="chevron-back-outline" size={20} color="#000000" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={{ marginLeft: 24 }}
                                    onPress={handleForward}
                                >
                                    <Ionicons
                                        name="chevron-forward-outline"
                                        size={20}
                                        color={canForward() ? '#000000' : '#B9B9B9'}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.7} style={{ marginLeft: 34 }}>
                                    <Ionicons name="calendar-outline" size={20} color="#000000" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ marginTop: 16, height: 169, width: '100%', flexDirection: 'row' }}>
                            <View style={{
                                flex: 1,
                                backgroundColor: '#F0FDF4',
                                borderRadius: 16,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <Ionicons name="calendar" size={50} color="#22C55E" />
                                <Text style={{ marginTop: 4, fontSize: 12, color: '#4D4D4D' }}>Số công thực tế</Text>
                                <Text style={{ marginTop: 4, fontSize: 20, color: '#4D4D4D', fontWeight: '500' }}>12/24</Text>
                            </View>
                            <View style={{ width: 24, backgroundColor: 'white' }} />
                            <View style={{
                                flex: 1,
                                backgroundColor: '#EFF6FF',
                                borderRadius: 16,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <Ionicons name="time" size={50} color="#2563EB" />
                                <Text style={{ marginTop: 4, fontSize: 12, color: '#4D4D4D' }}>Số công thực tế</Text>
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
                            <View style={{ marginTop: 16, backgroundColor: "#FFFFFF", padding: 12, borderRadius: 12 }}>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
                                    {days.map((d, index) => {
                                        const dotColor = getDotColor(d);
                                        const isToday = dayjs(d.full).isSame(dayjs(), 'day');
                                        return (
                                            <View
                                                key={index}
                                                style={{
                                                    width: "20%",
                                                    borderWidth: 1,
                                                    borderColor: isToday ? '#2563EB' : "#E5E7EB",
                                                    borderRadius: 8,
                                                    paddingVertical: 10,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={{ fontSize: 12, color: "#6B7280" }}>{d.weekday}</Text>
                                                <Text style={{ fontSize: 14, color: "#111827", fontWeight: "600", marginTop: 2 }}>
                                                    {d.date}
                                                </Text>
                                                <View
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 50,
                                                        backgroundColor: dotColor,
                                                        marginTop: 6,
                                                    }}
                                                />
                                            </View>
                                        );
                                    })}
                                </View>

                                <TouchableOpacity
                                    style={{ alignSelf: 'center', padding: 8, marginTop: 12 }}
                                    activeOpacity={0.7}
                                    onPress={() => setShowDetail(false)}
                                >
                                    <Text style={{ fontSize: 16, color: '#3B82F6', fontWeight: '500' }}>
                                        Thu gọn
                                    </Text>
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
    container: { flex: 1, backgroundColor: '#F7F7F7' },
    timeAndImageContainer: {
        height: 170,
        width: '100%',
        backgroundColor: 'white',
        marginTop: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    timeInfo: { flex: 1, justifyContent: 'center', marginLeft: 24 },
    currentTimeText: { fontSize: 32, fontWeight: 'bold', color: '#212121', fontFamily: 'sans-serif-light', marginBottom: 12 },
    currentDateText: { fontSize: 16, fontWeight: '500', color: '#757575', marginTop: -5 },
    illustrationWrapper: { height: '100%', flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 4 },
    checkButton: { flex: 1, height: 71, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09A896', borderRadius: 9999 },
    checkButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
});
