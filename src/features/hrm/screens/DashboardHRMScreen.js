import {
    Alert,
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from "../../../components/Header";
import { openDrawer } from "../../../helpers/navigationRef";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import localeData from 'dayjs/plugin/localeData';
dayjs.extend(localeData);
dayjs.locale('vi');

import utils from "../../../helpers/utils";
import { useSelector } from 'react-redux';
import BirthdayPanel from "../components/BirthdayPanel";
import useUser from "../../../hooks/useUser";
import {
    useCurrentWorkSheet,
    useCheckIn,
    useLichCong,
} from "../../attendance";
import { Bell, Menu } from 'lucide-react-native';

const getGreeting = (fullName, sex) => {
    const h = new Date().getHours();
    const time    = h < 12 ? 'buổi sáng' : h < 18 ? 'buổi chiều' : 'buổi tối';
    const pronoun = sex === 0 ? 'chị' : 'anh';
    const name    = fullName?.trim().split(/\s+/).pop() ?? '';
    return `Chào ${time}, ${pronoun} ${name}`;
};

const weekdayAbbreviations = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const TimeDisplay = ({ style }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

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

    return (
        <>
            <Text style={style.dateText}>
                {date}
            </Text>
        </>
    );
};


export default function DashboardHRMScreen() {
    const auth = useSelector(state => state.auth);
    const { getBirthdayThisMonth } = useUser();

    const [birthdayData, setBirthdayData] = useState([]);

    const { currentWorkSheet } = useCurrentWorkSheet();
    const checkInMutation = useCheckIn();
    const { summary: lichCongSummary, calendarData } = useLichCong();
    const [isLoading, setIsLoading] = useState(false);

    const rippleAnimations = [
        useRef(new Animated.Value(0)),
        useRef(new Animated.Value(0)),
        useRef(new Animated.Value(0)),
    ];
    const ripples = rippleAnimations.map(ref => ref.current);

    const rippleLoopsRef = useRef([]);

    const today = dayjs();

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

    const days = useMemo(() => {
        const list = [];
        let current = startDate;
        while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
            list.push(current);
            current = current.add(1, 'day');
        }
        return list;
    }, [startDate, endDate]);

    const loadBirthdays = useCallback(
     async () => {
        setIsLoading(true);
         try {
            const res = await getBirthdayThisMonth();
            
            setBirthdayData(res?.data?.data || []);
         } catch (error) {
            console.log("Load birthdays error:", error?.message || error);
         } finally {
            setIsLoading(false);
         }
      },
      [],
    )
    
    useEffect(() => {
      loadBirthdays();
    }, [])

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

    const hasCheckedIn = Boolean(currentWorkSheet?.check_in);
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

    const sendAttendance = () => {
        if (checkInMutation.isPending || hasCheckedIn) return;
        checkInMutation.mutate();
    }

    const buttonDisabled = Boolean(checkInMutation.isPending || hasCheckedIn);
    const shiftNameToday = currentWorkSheet ? getShiftName(currentWorkSheet) : 'Đang tải ca...';

    const getAttendanceStatus = (day) => {
        const dateKey = day.format('YYYY-MM-DD');
        const workSheet = calendarData[dateKey];
        const isTodayOrPast = !day.isAfter(today, 'day');
        const isSunday = day.day() === 0;

        if (isSunday) {
            if (!workSheet || workSheet.status === 'off') {
                return '#3498DB';
            }
        }

        if (workSheet && workSheet.status === 'off') {
            return null;
        }

        if (!workSheet) {
            if (isTodayOrPast) {
                return '#FF0000';
            }
            return null;
        }

        const checkIn = workSheet.check_in;
        const checkOut = workSheet.check_out;

        if (!checkIn && !checkOut) {
            return '#FF0000';
        }

        if (checkIn && checkOut) {
            return '#00A896';
        }

        return '#FFD700';
    };

    const showDayDetails = (day) => {
        const dateKey = day.format('YYYY-MM-DD');
        const workSheet = calendarData[dateKey];
        const isFuture = day.isAfter(today, 'day');
        const isSunday = day.day() === 0;

        let formattedDateRaw = day.locale('vi').format('dddd, DD/MM/YYYY');
        let formattedDate = capitalizeFirstLetter(formattedDateRaw);

        let title = formattedDate;
        let message = '';

        if (isSunday && (!workSheet || workSheet.status === 'off')) {
            message = 'Ngày nghỉ cuối tuần (Chủ Nhật).';
            Alert.alert(title, message);
            return;
        }

        if (isFuture) {
            if (workSheet) {
                const shiftName = getShiftName(workSheet);
                message = `Đã xếp ca: ${shiftName}\n(Từ ${utils.formatTime(workSheet.shifts[0].start_time, true)} đến ${utils.formatTime(workSheet.shifts[0].end_time, true)})`;
            } else {
                message = 'Chưa có ca làm việc nào được xếp cho ngày này.';
            }
        } else {
            if (workSheet) {
                const shiftName = getShiftName(workSheet);
                const checkInTime = workSheet.check_in ? utils.formatTime(workSheet.check_in, true) : 'Chưa Check-in';
                const checkOutTime = workSheet.check_out ? utils.formatTime(workSheet.check_out, true) : 'Chưa Check-out';
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
                        message += `\nĐã muộn: ${minutesLate} phút 😆`;
                    }
                }
            } else {
                message = 'Không có thông tin ca làm việc nào được ghi nhận.\nTrạng thái: NGHỈ KHÔNG PHÉP hoặc cần báo cáo bổ sung.';
            }
        }

        Alert.alert(title, message);
    };


    return (
        <View style={styles.container}>
            <Header
                title="HRM"
                LeftIcon={Menu}
                onLeftPress={() => { openDrawer(); }}
                RightIcon={Bell}
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
                <View style={styles.greetingBox}>
                    <Text style={styles.greetingTitle}>{getGreeting(auth.user?.full_name, auth.user?.sex)}</Text>
                    <Text style={styles.greetingDate}>
                        {dayjs().format('dddd, DD/MM/YYYY').replace(/^\w/, (c) => c.toUpperCase())} · HRM
                    </Text>
                </View>

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
                        <TimeDisplay style={{ timeText: styles.timeButtonText, dateText: { height: 0 } }} />


                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                                    {checkInMutation.isPending ? (
                                        <ActivityIndicator size="large" color="#fff" />
                                    ) : (
                                        <Ionicons name="finger-print" size={48} color="#fff" />
                                    )}
                                </View>
                            </View>

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
                                    <Text
                                        style={{
                                            color: '#e0f2f1',
                                            fontSize: 15,
                                        }}
                                    >
                                        Bấm để ghi nhận thời gian bắt đầu làm việc
                                    </Text>
                                ) : (
                                    <>
                                        <Text
                                            style={{
                                                color: '#e0f2f1',
                                                fontSize: 15,
                                                fontWeight: '600',
                                                marginBottom: minutesLate > 0 ? 8 : 0,
                                            }}
                                        >
                                            Vào: {utils.formatTime(currentWorkSheet.check_in, true)}
                                        </Text>

                                        {minutesLate > 0 && (
                                            <Text
                                                style={{
                                                    color: '#ffdd00',
                                                    fontSize: 14,
                                                    fontWeight: '700',
                                                }}
                                            >
                                                (Đã muộn {minutesLate} phút) 😆
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
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>Ngày phép còn lại</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '800', textAlign: 'center', fontSize: 20 }}>{auth.user?.leave_balance?.annual ?? 0}</Text>
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
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>Đi muộn / về sớm</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '800', textAlign: 'center', fontSize: 20 }}>{lichCongSummary.totalMinutes}</Text>
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
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '600', textAlign: 'center' }}>Quên chấm công</Text>
                        <Text style={{ color: '#004643', marginTop: 8, fontWeight: '800', textAlign: 'center', fontSize: 20 }}>{lichCongSummary.forgotCount}</Text>
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

                        const dayIndex = day.day();
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

                <BirthdayPanel birthdays={birthdayData} isLoading={isLoading}  style={{marginTop: 16}}/>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    greetingBox: { paddingVertical: 16 },
    greetingTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    greetingDate: { fontSize: 13, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
    dateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#004643',
        alignSelf: 'center',
        marginTop: 20,
    },
    timeButtonText: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
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