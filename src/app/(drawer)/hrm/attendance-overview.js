import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import Header from "../../../components/Header";
import useAllWorkSheets from "../../../features/hrmAttendanceAdmin/hooks/useAllWorkSheets";
import { ChevronLeft } from 'lucide-react-native';
import { Skeleton, SkeletonCircle } from "../../../components/Skeleton";

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
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const {
        data: worksheets = [],
        isLoading: loading,
        isFetching,
        refetch,
    } = useAllWorkSheets(selectedDate.format('YYYY-MM-DD'));
    const refreshing = isFetching && !loading;

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
                onLeftPress={() => router.back()}
            />

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
                <View style={styles.listContent}>
                    <View style={styles.statsRow}>
                        {[0, 1, 2, 3].map((i) => (
                            <View key={i} style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
                                <Skeleton width={30} height={20} borderRadius={4} />
                                <Skeleton width={50} height={11} borderRadius={4} style={{ marginTop: 6 }} />
                            </View>
                        ))}
                    </View>
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <View key={idx} style={styles.row}>
                            <SkeletonCircle size={40} />
                            <View style={styles.rowInfo}>
                                <Skeleton width={120} height={14} borderRadius={4} />
                                <Skeleton width={60} height={11} borderRadius={4} style={{ marginTop: 4 }} />
                            </View>
                            <View style={styles.rowRight}>
                                <Skeleton width={60} height={16} borderRadius={6} />
                                <Skeleton width={70} height={11} borderRadius={4} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={worksheets}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={refetch} colors={['#ED2E30']} tintColor="#ED2E30" />
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
