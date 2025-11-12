import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../../components/Header'
import { openDrawer } from '../../helpers/navigationRef'
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import api from '../../api/axiosInstance';
import WifiManager from 'react-native-wifi-reborn';
import { Linking, AppState } from 'react-native';
import * as Location from 'expo-location';


export default function DashboardHRMScreen() {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const ripples = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

    const today = dayjs();

    // ✅ Xác định khoảng thời gian hiển thị
    const { startDate, endDate } = useMemo(() => {
        let start, end;
        if (today.date() >= 26) {
            // 👉 Hôm nay >= 26 → hiển thị 26 tháng này đến 25 tháng sau
            start = today.date(26);
            end = today.add(1, 'month').date(25);
        } else {
            // 👉 Hôm nay <= 25 → hiển thị 26 tháng trước đến 25 tháng này
            start = today.subtract(1, 'month').date(26);
            end = today.date(25);
        }
        return { startDate: start.startOf('day'), endDate: end.endOf('day') };
    }, [today]);

    // 📆 Tạo danh sách ngày
    const days = useMemo(() => {
        const list = [];
        let current = startDate;
        while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
            list.push(current);
            current = current.add(1, 'day');
        }
        return list;
    }, [startDate, endDate]);



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

    const startRipple = (anim, delay) => {
        Animated.loop(
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
        ).start();
    };

    useEffect(() => {
        startRipple(ripples[0], 0);
        startRipple(ripples[1], 1000);
        startRipple(ripples[2], 2000);
    }, []);
    const sendAttendance = async () => {
        try {
            const ssid = await WifiManager.getCurrentWifiSSID();
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords

            const res = await api.post('attendance/sendAttendance', {
                ssid:"VNFITE tang 3_5G", latitude, longitude
            }, { requiresAuth: true })
            console.log(res.data)
        } catch (error) {
            console.log('Lỗi lấy SSID:', error?.message || error);
            Alert.alert(
                'Quyền vị trí bị tắt',
                'Ứng dụng cần quyền truy cập vị trí để lấy vị trí hiện tại và tên Wi-Fi. Mở cài đặt để bật lại?',
                [
                    { text: 'Huỷ', style: 'cancel' },
                    { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
                ],
            );
            return null;
        }

    }


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

            {/* 🔽 Đặt ScrollView full màn */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 16,
                    paddingBottom: 30, // thêm nếu muốn có khoảng trống cuối
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

                <TouchableOpacity activeOpacity={0.85}
                    onPress={() => {
                        sendAttendance()
                    }}
                >
                    <LinearGradient
                        colors={['#004643', '#00a896']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            alignItems: 'center',
                            borderRadius: 16,
                            padding: 16,
                            marginTop: 20,
                            overflow: 'hidden',
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
                                {ripples.map((anim, i) => {
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
                                    <Ionicons name="finger-print" size={48} color="#fff" />
                                </View>
                            </View>

                            {/* 📋 Nội dung bên phải */}
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: 18,
                                        fontWeight: '700',
                                        marginBottom: 12,
                                    }}
                                >
                                    Chấm công nhanh
                                </Text>
                                <Text
                                    style={{
                                        color: '#e0f2f1',
                                        fontSize: 15,
                                    }}
                                >
                                    Bấm để ghi nhận thời gian bắt đầu làm việc
                                </Text>
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