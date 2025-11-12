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
import api from '../../api/axiosInstance';
import WifiManager from 'react-native-wifi-reborn';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import utils from '../../helpers/utils';


export default function DashboardHRMScreen() {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [currentWorkSheet, setCurrentWorkSheet] = useState(null);
    const [isLoading, setIsLoading] = useState(false); 

    // Dùng useRef cho Animated.Value (Để điều khiển UI)
    const rippleAnimations = [
        useRef(new Animated.Value(0)),
        useRef(new Animated.Value(0)),
        useRef(new Animated.Value(0)),
    ];
    const ripples = rippleAnimations.map(ref => ref.current);

    // Dùng useRef để lưu trữ các đối tượng Loop đang chạy (Để gọi .stop())
    const rippleLoopsRef = useRef([]); 

    const today = dayjs();

    // Xác định khoảng thời gian hiển thị (Giữ nguyên)
    const { startDate, endDate } = useMemo(() => {
        let start, end;
        if (today.date() >= 26) {
            // Hôm nay >= 26 → hiển thị 26 tháng này đến 25 tháng sau
            start = today.date(26);
            end = today.add(1, 'month').date(25);
        } else {
            // 👉 Hôm nay <= 25 → hiển thị 26 tháng trước đến 25 tháng này
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

    // Lấy WorkSheet của ngày hôm nay
    const getCurrentWorkSheet = async () => {
        try {
            const res = await api.get(`attendance/getWorkSheet`, { requiresAuth: true })
            // Lấy WorkSheet của ngày hôm nay, thường là phần tử đầu tiên nếu API trả về 1 ngày
            const todayWorkSheet = res.data?.data && res.data.data.length > 0 ? res.data.data[0] : null;
            setCurrentWorkSheet(todayWorkSheet);
        } catch (error) {
            console.log("getCurrentWorkSheet error:", error.response?.data || error.message);
            setCurrentWorkSheet(null);
        }
    }

    useEffect(() => {
        getCurrentWorkSheet()
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

        updateTime(); // gọi ngay khi mount
        const timer = setInterval(updateTime, 1000); // cập nhật mỗi giây

        return () => clearInterval(timer);
    }, []);

    // Hàm tạo và chạy một animation loop
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

    // Xác định trạng thái đã chấm công dựa trên trường 'check_in'
    const hasCheckedIn = currentWorkSheet && currentWorkSheet.check_in;

    const minutesLate = currentWorkSheet && currentWorkSheet.minutes_late ? parseInt(currentWorkSheet.minutes_late, 10) : 0;

    const getShiftName = () => {
        const shifts = currentWorkSheet?.shifts;
        if (!shifts || shifts.length === 0) {
            return "Không rõ ca";
        }
        if (shifts.length >= 2) {
            return "Ca hành chính";
        }
        return shifts[0].name || "Không tên ca";
    };

    // Logic quản lý hiệu ứng ripple
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

    // Logic chấm công
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
                // Cập nhật lại WorkSheet
                await getCurrentWorkSheet(); 
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
            setIsLoading(false); // Kết thúc loading
        }
    }
    
    // 💡 Xác định trạng thái của nút
    const buttonDisabled = isLoading || hasCheckedIn;
    // 💡 Lấy tên ca chỉ khi currentWorkSheet đã được tải (dù có check-in hay không)
    const shiftName = currentWorkSheet ? getShiftName() : 'Đang tải ca...';

    return (
        <View style={styles.container}>
            <Header
                title="Xin chào, Lâm !"
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
                                ? ['#a0a0a0', '#c0c0c0'] // Màu xám khi disabled
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
                                {/* 💨 Hiển thị hiệu ứng Ripple chỉ khi CHƯA Check-in */}
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
                                
                                {/* 🚨 HIỂN THỊ TÊN CA LUÔN KHI ĐÃ TẢI DỮ LIỆU */}
                                <Text
                                    style={{
                                        color: '#fff', 
                                        fontSize: 15,
                                        fontWeight: '700',
                                        marginBottom: hasCheckedIn ? 8 : 12, // Giữ khoảng cách cố định
                                    }}
                                >
                                    Ca: {shiftName}
                                </Text>

                                {!hasCheckedIn ? (
                                    // 🎯 CHƯA check-in: Hiển thị hướng dẫn
                                    <Text
                                        style={{
                                            color: '#e0f2f1',
                                            fontSize: 15,
                                        }}
                                    >
                                        Bấm để ghi nhận thời gian bắt đầu làm việc
                                    </Text>
                                ) : (
                                    // 🎯 ĐÃ check-in: Hiển thị thời gian và thông báo muộn
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
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '800', textAlign: 'center', fontSize: 20 }}>4</Text>
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

                        const weekdayMap = {
                            'Monday': 'T2',
                            'Tuesday': 'T3',
                            'Wednesday': 'T4',
                            'Thursday': 'T5',
                            'Friday': 'T6',
                            'Saturday': 'T7',
                            'Sunday': 'CN',
                        };
                        const weekday = weekdayMap[day.format('dddd')] || day.format('dd');

                        // ✅ Nếu là mùng 1 thì hiển thị thêm tháng
                        const dayDisplay =
                            day.date() === 1
                                ? `${day.format('DD')}/${day.format('MM')}`
                                : day.format('DD');
                        return (
                            <View
                                key={day.format('YYYY-MM-DD')}
                                style={[
                                    styles.dayBox,
                                    isToday && styles.todayBox,
                                ]}
                            >
                                <Text style={[styles.dayText, isToday && styles.todayText]}>
                                    {dayDisplay}
                                </Text>
                                <Text style={[styles.weekdayText, isToday && styles.todayText]}>
                                    {weekday}
                                </Text>
                            </View>
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
})