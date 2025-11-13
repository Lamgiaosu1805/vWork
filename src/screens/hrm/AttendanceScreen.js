import { Alert, Image, ScrollView, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { openDrawer } from '../../helpers/navigationRef';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');
const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Dữ liệu giả lập cho UI 3 ô trạng thái
const mockTodayData = {
    gioVao: '08:03',
    gioRa: '-:-',
    soGioLam: '05:28',
    isCheckIn: true,
    isCheckOut: false,
    lateMinutes: '00:00',
    isLate: false,
};

// Styles dành riêng cho 3 ô trạng thái (Định nghĩa riêng để không xung đột)
const statusStyles = StyleSheet.create({
    statusBox: {
        flex: 1,
        backgroundColor: '#E0F2F1', 
        borderRadius: 10,
        padding: 12,
        justifyContent: 'space-between',
        minHeight: 120, 
        alignItems: 'flex-start',
    },
    statusValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 16,
        alignSelf: 'center',
    },
    statusTitle: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
        marginBottom: 4,
    },
    statusLabelText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

// Component con để render từng ô trạng thái
const InlineStatusBox = ({ title, value, statusLabel, statusColor, showClockIcon = false }) => (
    <View style={statusStyles.statusBox}>
        <Text style={statusStyles.statusTitle}>{title}</Text>
        
        <Text style={statusStyles.statusValue}>{value}</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[statusStyles.statusLabelText, { color: statusColor }]}>
                {/* Icon Check/Cross/Clock */}
                {showClockIcon ? '🕒' : (statusColor === '#00A896' ? '✅' : '❌')}
                {' '}
                {statusLabel}
            </Text>
        </View>
    </View>
);

// Hàm render toàn bộ phần grid, chỉ còn 3 ô trạng thái
const renderFullStatusSection = () => (
    <View style={{ marginTop: 12, backgroundColor: 'white', borderRadius: 16, padding: 16 }}>
        {/* 🚨 KHÔNG CÓ HEADER NGÀY THÁNG */}
        
        {/* CÁC Ô TRẠNG THÁI */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Giờ vào */}
            <InlineStatusBox
                title="Giờ vào"
                value={mockTodayData.gioVao}
                statusLabel={mockTodayData.isCheckIn ? 'Đã check in' : 'Chưa check in'}
                statusColor={'#00A896'}
                showClockIcon={false}
            />
            <View style={{ width: 10 }} /> 
            {/* Giờ ra */}
            <InlineStatusBox
                title="Giờ ra"
                value={mockTodayData.gioRa}
                statusLabel={mockTodayData.isCheckOut ? 'Đã check out' : 'Chưa check out'}
                statusColor={'#FF0000'}
                showClockIcon={false}
            />
            <View style={{ width: 10 }} /> 
            {/* Số giờ làm */}
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

export default function AttendanceScreen() {
    const [currentTime, setCurrentTime] = useState(dayjs());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const timeDisplay = currentTime.format('HH:mm:ss');

    const rawDateDisplay = currentTime.format('dddd DD/MM/YYYY');
    const dateDisplay = capitalizeFirstLetter(rawDateDisplay);

    const IMAGE_HEIGHT = 134;

    return (
        <View style={styles.container}>
            <Header
                title="Chấm công"
                leftIconName="menu"
                onLeftPress={() => {
                    openDrawer()
                }}
                rightIconName="notifications"
                onRightPress={() => Alert.alert('Notifications Pressed')}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 20,
                    paddingBottom: 30,
                }}
            >
                <View style={styles.timeAndImageContainer}>
                    <View style={styles.timeInfo}>
                        <Text style={styles.currentTimeText}>{timeDisplay}</Text>
                        <Text style={styles.currentDateText}>{dateDisplay}</Text>
                    </View>
                    <View style={styles.illustrationWrapper}>
                        <Image
                            source={require('../../../assets/images/OBJECTS.png')}
                            style={{
                                height: IMAGE_HEIGHT,
                                width: null,
                                aspectRatio: 1.5,
                            }}
                            resizeMode="contain"
                        />
                    </View>
                </View>
                
                {/* PHẦN NÚT CHECK IN/OUT (KHÔNG SỬA) */}
                <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity style={styles.checkButton} activeOpacity={0.7}>
                        <Text style={styles.checkButtonText}>CHECK IN</Text>
                    </TouchableOpacity>
                    <View style={{ width: 16 }} />
                    <TouchableOpacity style={styles.checkButton} activeOpacity={0.7}>
                        <Text style={styles.checkButtonText}>CHECK OUT</Text>
                    </TouchableOpacity>
                </View>
                
                <Text style={{ fontSize: 14, color: '#B9B9B9', fontStyle: 'italic', fontWeight: '500', marginTop: 16, lineHeight: 20 }}>
                    *Lưu ý: Giờ hành chính làm việc từ 08 giờ và kết thúc lúc 17 giờ, được phép chấm công muộn 5 phút so với giờ bắt đầu làm việc.
                </Text>
                
                {/* 🚨 PHẦN ĐÃ THÊM UI 3 Ô TRẠNG THÁI */}
                {renderFullStatusSection()}
                
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
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
    timeInfo: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: 24
    },
    // SỬA: Font size để chứa giây
    currentTimeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#212121',
        fontFamily: 'sans-serif-light',
        marginBottom: 12
    },
    currentDateText: {
        fontSize: 16, // Tăng nhẹ để dễ đọc hơn
        fontWeight: '500',
        color: '#757575',
        marginTop: -5, // Dịch lên một chút
    },
    illustrationWrapper: {
        height: '100%',
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingBottom: 4,
    },
    checkButton: {
        flex: 1,
        height: 71,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09A896',
        borderRadius: 9999
    },
    checkButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF'
    }
});