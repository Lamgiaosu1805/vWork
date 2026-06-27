import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import api from '../../api/axiosInstance';
import Header from '../../components/Header';
import { ChevronLeft } from 'lucide-react-native';

dayjs.locale('vi');

const getStatus = (ws) => {
    if (!ws.check_in) return { label: 'Chưa vào', bg: '#F3F4F6', color: '#6B7280' };
    if (ws.minutes_late > 0) return { label: `Muộn ${ws.minutes_late}p`, bg: '#FEF3C7', color: '#D97706' };
    if (!ws.check_out) return { label: 'Đang làm', bg: '#DBEAFE', color: '#2563EB' };
    if (ws.minute_early > 0) return { label: `Về sớm ${ws.minute_early}p`, bg: '#FEF3C7', color: '#D97706' };
    return { label: 'Đúng giờ', bg: '#D1FAE5', color: '#059669' };
};

const fmtTime = (iso) => (iso ? dayjs(iso).format('HH:mm') : '—');

const StatCard = ({ label, value, color, bg }) => (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const EmployeeRow = ({ ws }) => {
    const user = ws.user_id;
    const status = getStatus(ws);
    return (
        <View style={styles.row}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {(user?.full_name ?? '?').trim().split(' ').pop()[0].toUpperCase()}
                </Text>
            </View>
            <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{user?.full_name ?? '—'}</Text>
                <Text style={styles.rowSub}>{user?.ma_nv ?? '—'}</Text>
            </View>
            <View style={styles.rowRight}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
                <Text style={styles.rowTime}>
                    {fmtTime(ws.check_in)} {ws.check_out ? `→ ${fmtTime(ws.check_out)}` : ''}
                </Text>
            </View>
        </View>
    );
};

export default function AttendanceOverviewScreen() {
    const navigation = useNavigation();
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [worksheets, setWorksheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (date) => {
        try {
            const res = await api.get('/attendance/getAllWorkSheets', {
                requiresAuth: true,
                params: { date: date.format('YYYY-MM-DD') },
            });
            setWorksheets(res.data?.data ?? []);
        } catch (err) {
            console.log('AttendanceOverview fetch error:', err.message);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchData(selectedDate);
            setLoading(false);
        };
        load();
    }, [fetchData, selectedDate]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData(selectedDate);
        setRefreshing(false);
    }, [fetchData, selectedDate]);

    const changeDate = (delta) => setSelectedDate((d) => d.add(delta, 'day'));

    const stats = {
        present: worksheets.filter((w) => w.check_in).length,
        absent: worksheets.filter((w) => !w.check_in).length,
        late: worksheets.filter((w) => w.check_in && w.minutes_late > 0).length,
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <Header
                title="Tình trạng chấm công"
                LeftIcon={ChevronLeft}
                onLeftPress={() => navigation.goBack()}
            />

            {/* Chọn ngày */}
            <View style={styles.dateBar}>
                <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
                    <Ionicons name="chevron-back" size={20} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.dateText}>
                    {selectedDate.format('dddd, DD/MM/YYYY').replace(/^\w/, c => c.toUpperCase())}
                </Text>
                <TouchableOpacity
                    onPress={() => changeDate(1)}
                    style={styles.dateArrow}
                    disabled={selectedDate.isSame(dayjs(), 'day')}
                >
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={selectedDate.isSame(dayjs(), 'day') ? '#D1D5DB' : '#374151'}
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#ED2E30" />
                </View>
            ) : (
                <FlatList
                    data={worksheets}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ED2E30']} tintColor="#ED2E30" />
                    }
                    ListHeaderComponent={
                        <View style={styles.statsRow}>
                            <StatCard label="Đã vào" value={stats.present} color="#059669" bg="#D1FAE5" />
                            <StatCard label="Chưa vào" value={stats.absent} color="#DC2626" bg="#FEE2E2" />
                            <StatCard label="Đi muộn" value={stats.late} color="#D97706" bg="#FEF3C7" />
                            <StatCard label="Tổng" value={worksheets.length} color="#2563EB" bg="#DBEAFE" />
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Không có dữ liệu cho ngày này</Text>
                        </View>
                    }
                    renderItem={({ item }) => <EmployeeRow ws={item} />}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },

    dateBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dateArrow: { padding: 6 },
    dateText: { fontSize: 14, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },

    statsRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center' },

    listContent: { paddingBottom: 40 },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    separator: { height: 1, backgroundColor: '#F9FAFB' },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 15, fontWeight: '700', color: '#2563EB' },

    rowInfo: { flex: 1 },
    rowName: { fontSize: 14, fontWeight: '600', color: '#111827' },
    rowSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },

    rowRight: { alignItems: 'flex-end', gap: 4 },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: { fontSize: 11, fontWeight: '700' },
    rowTime: { fontSize: 11, color: '#9CA3AF' },

    emptyText: { fontSize: 13, color: '#9CA3AF', marginTop: 12 },
});
