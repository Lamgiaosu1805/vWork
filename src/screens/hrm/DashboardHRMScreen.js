import {
    Alert,
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking,
    ActivityIndicator,
} from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../../components/Header';
import { openDrawer } from '../../helpers/navigationRef';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import localeData from 'dayjs/plugin/localeData';
dayjs.extend(localeData);

import api from '../../api/axiosInstance';
import WifiManager from 'react-native-wifi-reborn';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import utils from '../../helpers/utils';
import { useSelector } from 'react-redux'; // ✅ Import useSelector


// Dùng mảng tra cứu dựa trên chỉ số ngày (0=CN, 1=T2, ...)
const weekdayAbbreviations = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// HÀM HỖ TRỢ: Viết hoa chữ cái đầu tiên (ví dụ: "thứ hai" -> "Thứ hai")
const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}


export default function DashboardHRMScreen() {
    const auth = useSelector(state => state.auth);
    const firstName = useMemo(() => {
        const fullName = auth.user?.full_name;
        if (!fullName) return 'Bạn';
        const parts = fullName.trim().split(/\s+/);
        return parts[parts.length - 1];
    }, [auth.user?.full_name]);

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [currentWorkSheet, setCurrentWorkSheet] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [calendarData, setCalendarData] = useState({});

    const rippleAnimations = [
        useRef(new Animated.Value(0)),
        useRef(new Animated.Value(0)),
        useRef(new Animated.Value(0)),
    ];
    const ripples = rippleAnimations.map(ref => ref.current);

    const rippleLoopsRef = useRef([]);

    const today = dayjs();

    // Xác định khoảng thời gian hiển thị (Giữ nguyên)
    const { startDate, endDate } = useMemo(() => {
        let start, end;
        if (today.date() >= 26) {
            start = today.date(26);
            end = today.add(1, 'month').date(25);
        } else {
            start = today.subtract(1, 'month').date(26);
            end = today.date(25);
        }
        return { startDate: start.startOf('day'), endDate: end.endOf('day') };
    }, [today]);

    // 📆 Tạo danh sách ngày (Giữ nguyên)
    const days = useMemo(() => {
        const list = [];
        let current = startDate;
        while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
            list.push(current);
            current = current.add(1, 'day');
        }
        return list;
    }, [startDate, endDate]);

    // Lấy WorkSheet của ngày hôm nay (Dùng cho nút chấm công)
    const getCurrentWorkSheet = async () => {
        try {
            const res = await api.get(`attendance/getWorkSheet`, { requiresAuth: true })
            const todayWorkSheet = res.data?.data && res.data.data.length > 0 ? res.data.data[0] : null;
            setCurrentWorkSheet(todayWorkSheet);
        } catch (error) {
            console.log("getCurrentWorkSheet error:", error.response?.data || error.message);
            setCurrentWorkSheet(null);
        }
    }

    // HÀM: Lấy lịch công cho toàn bộ kỳ lương
    const getLichCong = async () => {
        try {
            const params = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };

            const res = await api.get(`attendance/getLichCong`, { requiresAuth: true, params });

            const dataMap = (res.data?.data || []).reduce((acc, item) => {
                const dateKey = dayjs(item.date).format('YYYY-MM-DD');
                acc[dateKey] = item;
                return acc;
            }, {});

            setCalendarData(dataMap);
        } catch (error) {
            console.log("getLichCong error:", error.response?.data || error.message);
            setCalendarData({});
        }
    }


    useEffect(() => {
        // console.log("Auth User Data:", auth.user); // Log ở đây nếu cần

        getCurrentWorkSheet();
        getLichCong();
    }, [])

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();

            const formattedDate = now.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            const formattedTime = now.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            setDate(formattedDate);
            setTime(formattedTime);
        };

        updateTime();
        const timer = setInterval(updateTime, 1000);

        return () => clearInterval(timer);
    }, []);

    const createRippleLoop = (anim, delay) => {
        return Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );
    };

    const hasCheckedIn = currentWorkSheet && currentWorkSheet.check_in;
    const minutesLate = currentWorkSheet && currentWorkSheet.minutes_late ? parseInt(currentWorkSheet.minutes_late, 10) : 0;

    const getShiftName = (workSheet) => {
        const shifts = workSheet?.shifts;
        if (!shifts || shifts.length === 0) {
            return "Không rõ ca";
        }
        if (shifts.length >= 2) {
            return "Ca hành chính";
        }
        return shifts[0].name || "Không tên ca";
    };

    useEffect(() => {
        rippleLoopsRef.current.forEach(loop => loop.stop());
        rippleLoopsRef.current = [];

        if (!hasCheckedIn) {
            ripples.forEach((anim, i) => {
                anim.setValue(0);
                const loop = createRippleLoop(anim, i * 1000);
                rippleLoopsRef.current.push(loop);
                loop.start();
            });
        }

        return () => {
            rippleLoopsRef.current.forEach(loop => loop.stop());
            rippleLoopsRef.current = [];
        };
    }, [hasCheckedIn]);

    const sendAttendance = async () => {
        if (isLoading || hasCheckedIn) return;

        setIsLoading(true);
        try {
            const ssid = await WifiManager.getCurrentWifiSSID();
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords

            try {
                const res = await api.post('attendance/checkIn', {
                    ssid: ssid, latitude, longitude
                }, { requiresAuth: true })

                Toast.show({
                    type: "success",
                    text1: "Thông báo",
                    text2: res.data.message || 'Chấm công thành công!',
                });
                await getCurrentWorkSheet();
                await getLichCong();
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
        } finally {
            setIsLoading(false);
        }
    }

    const buttonDisabled = isLoading || hasCheckedIn;
    const shiftNameToday = currentWorkSheet ? getShiftName(currentWorkSheet) : 'Đang tải ca...';

    const getAttendanceStatus = (day) => {
        const dateKey = day.format('YYYY-MM-DD');
        const workSheet = calendarData[dateKey];
        const isTodayOrPast = !day.isAfter(today, 'day');
        const isSunday = day.day() === 0;

        // 1. NGÀY NGHỈ CUỐI TUẦN MẶC ĐỊNH
        if (isSunday) {
            if (!workSheet || workSheet.status === 'off') {
                return '#3498DB'; // Xanh dương cho Chủ Nhật nghỉ
            }
        }

        // 2. NGÀY NGHỈ CÓ KẾ HOẠCH (áp dụng cho mọi ngày)
        if (workSheet && workSheet.status === 'off') {
            return null;
        }

        // 3. THIẾU DỮ LIỆU/NGHỈ KHÔNG PHÉP (Đã qua/Hôm nay)
        if (!workSheet) {
            if (isTodayOrPast) {
                return '#FF0000'; // Đỏ
            }
            return null;
        }

        // 4. KIỂM TRA CHẤM CÔNG (Có Worksheet và không phải ngày nghỉ có kế hoạch)
        const checkIn = workSheet.check_in;
        const checkOut = workSheet.check_out;

        if (!checkIn && !checkOut) {
            return '#FF0000'; // Đỏ (Nghỉ không phép)
        }

        if (checkIn && checkOut) {
            return '#00A896'; // Xanh lá (Đầy đủ)
        }

        return '#FFD700'; // Vàng (Thiếu 1 trong 2)
    };

    const showDayDetails = (day) => {
        const dateKey = day.format('YYYY-MM-DD');
        const workSheet = calendarData[dateKey];
        const isFuture = day.isAfter(today, 'day');
        const isSunday = day.day() === 0;

        // Viết hoa chữ cái đầu tiên (Đảm bảo chữ "Thứ" viết hoa)
        let formattedDateRaw = day.locale('vi').format('dddd, DD/MM/YYYY');
        let formattedDate = capitalizeFirstLetter(formattedDateRaw);

        let title = formattedDate;
        let message = '';

        // 1. Chủ Nhật (Ngày nghỉ mặc định)
        if (isSunday && (!workSheet || workSheet.status === 'off')) {
            message = 'Ngày nghỉ cuối tuần (Chủ Nhật).';
            Alert.alert(title, message);
            return;
        }

        if (isFuture) {
            // 2. Ngày trong tương lai 
            if (workSheet) {
                const shiftName = getShiftName(workSheet);
                message = `Đã xếp ca: ${shiftName}\n(Từ ${utils.formatTime(workSheet.shifts[0].start_time, true)} đến ${utils.formatTime(workSheet.shifts[0].end_time, true)})`;
            } else {
                message = 'Chưa có ca làm việc nào được xếp cho ngày này.';
            }
        } else {
            // 3. Ngày đã qua hoặc hôm nay 
            if (workSheet) {
                const shiftName = getShiftName(workSheet);
                const checkInTime = workSheet.check_in ? utils.formatTime(workSheet.check_in) : 'Chưa Check-in';
                const checkOutTime = workSheet.check_out ? utils.formatTime(workSheet.check_out) : 'Chưa Check-out';
                const minutesLate = workSheet.minutes_late ? parseInt(workSheet.minutes_late, 10) : 0;

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
                        message += `\nĐã muộn: ${minutesLate} phút 😔`;
                    }
                }
            } else {
                // Ngày đã qua không có worksheet
                message = 'Không có thông tin ca làm việc nào được ghi nhận.\nTrạng thái: NGHỈ KHÔNG PHÉP hoặc cần báo cáo bổ sung.';
            }
        }

        Alert.alert(title, message);
    };


    return (
        <View style={styles.container}>
            <Header
                title={`Xin chào, ${firstName} !`}
                leftIconName="menu"
                onLeftPress={() => {
                    openDrawer();
                }}
                rightIconName="notifications"
                onRightPress={() => Alert.alert('Notifications Pressed')}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 16,
                    paddingBottom: 30,
                }}
            >
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: '#004643',
                        alignSelf: 'center',
                        marginTop: 20,
                    }}
                >
                    {date}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={sendAttendance}
                    disabled={buttonDisabled}
                >
                    <LinearGradient
                        colors={
                            buttonDisabled
                                ? ['#a0a0a0', '#c0c0c0']
                                : ['#004643', '#00a896']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            alignItems: 'center',
                            borderRadius: 16,
                            padding: 16,
                            marginTop: 20,
                            overflow: 'hidden',
                            opacity: buttonDisabled ? 0.8 : 1,
                        }}
                    >
                        <Text style={{ fontSize: 24, fontWeight: '700', color: 'white' }}>
                            {time}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* 🔵 Nút chấm công */}
                            <View
                                style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: 160,
                                    height: 160,
                                    marginRight: 20,
                                }}
                            >
                                {!hasCheckedIn &&
                                    ripples.map((anim, i) => {
                                        const scale = anim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 3.5],
                                        });
                                        const opacity = anim.interpolate({
                                            inputRange: [0, 0.8, 1],
                                            outputRange: [0.4, 0.2, 0],
                                        });
                                        return (
                                            <Animated.View
                                                key={i}
                                                style={{
                                                    position: 'absolute',
                                                    width: 100,
                                                    height: 100,
                                                    borderRadius: 50,
                                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                                    transform: [{ scale }],
                                                    opacity,
                                                }}
                                            />
                                        );
                                    })}
                                <View
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: 50,
                                        backgroundColor: 'rgba(255,255,255,0.25)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="large" color="#fff" />
                                    ) : (
                                        <Ionicons name="finger-print" size={48} color="#fff" />
                                    )}
                                </View>
                            </View>

                            {/*Nội dung bên phải */}
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: 18,
                                        fontWeight: '700',
                                        marginBottom: 4,
                                    }}
                                >
                                    {hasCheckedIn ? 'Đã Check-in!' : 'Chấm công nhanh'}
                                </Text>

                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: 15,
                                        fontWeight: '700',
                                        marginBottom: hasCheckedIn ? 8 : 12,
                                    }}
                                >
                                    Ca: {shiftNameToday}
                                </Text>

                                {!hasCheckedIn ? (
                                    // CHƯA check-in: Hiển thị hướng dẫn
                                    <Text
                                        style={{
                                            color: '#e0f2f1',
                                            fontSize: 15,
                                        }}
                                    >
                                        Bấm để ghi nhận thời gian bắt đầu làm việc
                                    </Text>
                                ) : (
                                    // ĐÃ check-in: Hiển thị thời gian và thông báo muộn
                                    <>
                                        <Text
                                            style={{
                                                color: '#e0f2f1',
                                                fontSize: 15,
                                                fontWeight: '600',
                                                marginBottom: minutesLate > 0 ? 8 : 0,
                                            }}
                                        >
                                            Vào: {utils.formatTime(currentWorkSheet.check_in)}
                                        </Text>

                                        {/* THÔNG BÁO MUỘN */}
                                        {minutesLate > 0 && (
                                            <Text
                                                style={{
                                                    color: '#ffdd00', // Màu cảnh báo
                                                    fontSize: 14,
                                                    fontWeight: '700',
                                                }}
                                            >
                                                (Đã muộn {minutesLate} phút) 😔
                                            </Text>
                                        )}
                                    </>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 20,
                        height: 160
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 16,
                            alignItems: 'center',
                            marginHorizontal: 4,
                            justifyContent: 'space-between'
                        }}
                    >
                        {/* <Ionicons name="people" size={32} color="#fff" /> */}
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>Ngày phép còn lại</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '800', textAlign: 'center', fontSize: 20 }}>{auth.user.leave_balance.annual || 0}</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>ngày</Text>
                    </View>

                    <View
                        style={{
                            flex: 1,
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 16,
                            alignItems: 'center',
                            marginHorizontal: 4,
                            justifyContent: 'space-between'
                        }}
                    >
                        {/* <Ionicons name="people" size={32} color="#fff" /> */}
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>Đi muộn / về sớm</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '800', textAlign: 'center', fontSize: 20 }}>15</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>phút</Text>
                    </View>

                    <View
                        style={{
                            flex: 1,
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 16,
                            alignItems: 'center',
                            marginHorizontal: 4,
                            justifyContent: 'space-between'
                        }}
                    >
                        {/* <Ionicons name="people" size={32} color="#fff" /> */}
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>Quên chấm công</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '800', textAlign: 'center', fontSize: 20 }}>10</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>lần</Text>
                    </View>
                </View>
                <Text style={styles.headerText}>
                    {`Lịch công (${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')})`}
                </Text>
                <View style={styles.calendarGrid}>
                    {days.map((day) => {
                        const isToday = day.isSame(today, 'day');

                        const statusColor = getAttendanceStatus(day);

                        const showStatusDot = statusColor !== null;

                        const dayIndex = day.day(); // 0 (Sunday) to 6 (Saturday)
                        const weekday = weekdayAbbreviations[dayIndex];

                        const dayDisplay =
                            day.date() === 1
                                ? `${day.format('DD')}/${day.format('MM')}`
                                : day.format('DD');
                        return (
                            <TouchableOpacity
                                key={day.format('YYYY-MM-DD')}
                                style={[
                                    styles.dayBox,
                                    isToday && styles.todayBox,
                                ]}
                                onPress={() => showDayDetails(day)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.dayText, isToday && styles.todayText]}>
                                    {dayDisplay}
                                </Text>
                                {/* HIỂN THỊ THỨ VIẾT TẮT (T2, CN) */}
                                <Text style={[styles.weekdayText, isToday && styles.todayText]}>
                                    {weekday}
                                </Text>

                                {showStatusDot && (
                                    <View style={[styles.simpleStatusDot, { backgroundColor: statusColor }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        borderRadius: 16,
    },
    dayBox: {
        width: '16%',
        height: 80,
        margin: 6,
        borderRadius: 12,
        backgroundColor: '#e0f2f1',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    todayBox: {
        backgroundColor: '#00a896',
    },
    dayText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#004643',
    },
    weekdayText: {
        fontSize: 12,
        color: '#555',
    },
    todayText: {
        color: '#fff',
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#004643',
        marginTop: 32
    },
    simpleStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        position: 'absolute',
        bottom: 12,
        left: '50%',
        marginLeft: -3,
    },
})