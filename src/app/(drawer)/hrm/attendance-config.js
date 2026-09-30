import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Header from "../../../components/Header";
import useAttendanceWifiLocations from "../../../features/hrmAttendanceAdmin/hooks/useAttendanceWifiLocations";
import { useGetAllShift } from "../../../features/requests";
import { ChevronLeft } from 'lucide-react-native';
import { Skeleton } from "../../../components/Skeleton";

const Section = ({ title, icon, color, children }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: `${color}18` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {children}
    </View>
);

const EmptyRow = ({ message }) => (
    <View style={styles.emptyRow}>
        <Text style={styles.emptyText}>{message}</Text>
    </View>
);

const RowSkeleton = ({ count = 2 }) => (
    <>
        {Array.from({ length: count }).map((_, idx) => (
            <View key={idx} style={[styles.row, idx < count - 1 && styles.rowBorder]}>
                <View style={styles.rowLeft}>
                    <Skeleton width={140} height={14} borderRadius={4} />
                    <Skeleton width={180} height={11} borderRadius={4} style={{ marginTop: 6 }} />
                    <Skeleton width={120} height={11} borderRadius={4} style={{ marginTop: 5 }} />
                </View>
                <Skeleton width={28} height={28} borderRadius={8} />
            </View>
        ))}
    </>
);

export default function AttendanceConfigScreen() {
    const {
        data: locations = [],
        isLoading: locationsLoading,
        isFetching: locationsFetching,
        refetch: refetchLocations,
    } = useAttendanceWifiLocations();
    const {
        data: allShifts,
        isLoading: shiftsLoading,
        refetch: refetchShifts,
    } = useGetAllShift();
    const shifts = (allShifts ?? []).filter((s) => !s.isDeleted);

    const loading = locationsLoading || shiftsLoading;
    const refreshing = locationsFetching && !locationsLoading;

    const onRefresh = () => {
        refetchLocations();
        refetchShifts();
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <Header
                title="Cấu hình chấm công"
                LeftIcon={ChevronLeft}
                onLeftPress={() => router.back()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ED2E30']} tintColor="#ED2E30" />
                }
            >
                <Section title="Điểm chấm công WiFi" icon="wifi" color="#2563EB">
                    {loading ? (
                        <RowSkeleton />
                    ) : locations.length === 0 ? (
                        <EmptyRow message="Chưa có điểm chấm công nào" />
                    ) : (
                        locations.map((loc, idx) => (
                            <View key={loc._id} style={[styles.row, idx < locations.length - 1 && styles.rowBorder]}>
                                <View style={styles.rowLeft}>
                                    <Text style={styles.rowName}>{loc.name || loc.ssid}</Text>
                                    <Text style={styles.rowSub}>SSID: {loc.ssid}</Text>
                                    <Text style={styles.rowSub}>
                                        {loc.latitude}, {loc.longitude} · Bán kính {loc.radius}m
                                    </Text>
                                </View>
                                <View style={styles.badge}>
                                    <Ionicons name="location" size={12} color="#2563EB" />
                                </View>
                            </View>
                        ))
                    )}
                </Section>

                <Section title="Ca làm việc" icon="time" color="#059669">
                    {loading ? (
                        <RowSkeleton />
                    ) : shifts.length === 0 ? (
                        <EmptyRow message="Chưa có ca làm việc nào" />
                    ) : (
                        shifts.map((s, idx) => (
                            <View key={s._id} style={[styles.row, idx < shifts.length - 1 && styles.rowBorder]}>
                                <View style={styles.rowLeft}>
                                    <Text style={styles.rowName}>{s.name}</Text>
                                    <Text style={styles.rowSub}>
                                        {s.start_time} – {s.end_time}
                                    </Text>
                                    <Text style={styles.rowSub}>
                                        Miễn trừ đi muộn: {s.late_allowance_minutes} phút
                                    </Text>
                                </View>
                                <View style={[styles.timeBadge]}>
                                    <Text style={styles.timeBadgeText}>{s.start_time}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </Section>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F6FA' },

    scroll: { padding: 16, paddingBottom: 40 },

    section: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    rowLeft: { flex: 1 },
    rowName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
    rowSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },

    badge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#D1FAE5',
    },
    timeBadgeText: { fontSize: 12, fontWeight: '700', color: '#065F46' },

    emptyRow: { paddingHorizontal: 14, paddingVertical: 16, alignItems: 'center' },
    emptyText: { fontSize: 13, color: '#9CA3AF' },
});
