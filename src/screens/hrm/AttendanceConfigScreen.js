import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/axiosInstance';
import Header from '../../components/Header';

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

export default function AttendanceConfigScreen() {
    const navigation = useNavigation();
    const [locations, setLocations] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            const [locRes, shiftRes] = await Promise.all([
                api.get('/attendance/getAllowedWifiLocations', { requiresAuth: true }),
                api.get('/attendance/getAllShifts', { requiresAuth: true }),
            ]);
            setLocations(locRes.data?.data ?? []);
            setShifts((shiftRes.data?.data ?? []).filter(s => !s.isDeleted));
        } catch (err) {
            console.log('AttendanceConfig fetch error:', err.message);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchAll();
            setLoading(false);
        };
        load();
    }, [fetchAll]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    }, [fetchAll]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ED2E30" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <Header
                title="Cấu hình chấm công"
                leftIconName="arrow-back"
                onLeftPress={() => navigation.goBack()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ED2E30']} tintColor="#ED2E30" />
                }
            >
                {/* Điểm WiFi */}
                <Section title="Điểm chấm công WiFi" icon="wifi" color="#2563EB">
                    {locations.length === 0 ? (
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

                {/* Ca làm việc */}
                <Section title="Ca làm việc" icon="time" color="#059669">
                    {shifts.length === 0 ? (
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
