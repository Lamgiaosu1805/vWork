import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    Modal, Pressable, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosInstance';
import dayjs from 'dayjs';

export default function CommissionScreen() {
    const now = new Date();
    const [isFilterVisible, setFilterVisible] = useState(false);
    const [appliedMonth, setAppliedMonth] = useState(now.getMonth() + 1);
    const [appliedYear, setAppliedYear] = useState(now.getFullYear());
    const [tempMonth, setTempMonth] = useState(now.getMonth() + 1);
    const [tempYear, setTempYear] = useState(now.getFullYear());

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);
    const [commissions, setCommissions] = useState([]);

    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const years = [2025, 2026, 2027];

    // Fetch dữ liệu từ API
    const fetchCommission = useCallback(async (month, year) => {
        try {
            const res = await api.get(
                `investments/my-commission?month=${month}&year=${year}`,
                { requiresAuth: true }
            );
            setSummary(res.data?.summary ?? null);
            setCommissions(res.data?.data ?? []);
        } catch (error) {
            console.log("fetchCommission error:", error.response?.data || error.message);
        }
    }, []);

    // Lần đầu load + khi đổi tháng/năm
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchCommission(appliedMonth, appliedYear);
            setLoading(false);
        };
        load();
    }, [appliedMonth, appliedYear]);

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchCommission(appliedMonth, appliedYear);
        setRefreshing(false);
    }, [appliedMonth, appliedYear]);

    const openFilter = () => {
        setTempMonth(appliedMonth);
        setTempYear(appliedYear);
        setFilterVisible(true);
    };

    const handleApplyFilter = () => {
        setAppliedMonth(tempMonth);
        setAppliedYear(tempYear);
        setFilterVisible(false);
    };

    // Format tiền VND
    const formatMoney = (amount) => {
        if (!amount) return "0 đ";
        return amount.toLocaleString("vi-VN") + " đ";
    };

    // Lấy tên KH từ data
    const getCustomerName = (item) => {
        const fullName = item?.customer_id?.identity?.full_name;
        const phone = item?.customer_id?.phone_number;
        if (fullName) return `KH: ${fullName}`;
        if (phone) return `KH: ${phone}`;
        return "KH: Không xác định";
    };

    // Format số tiền đầu tư ngắn gọn
    const formatAmountShort = (amount) => {
        if (!amount) return "";
        if (amount >= 1_000_000_000) return `Đầu tư ${(amount / 1_000_000_000).toFixed(1)}Tỷ`;
        if (amount >= 1_000_000) return `Đầu tư ${Math.round(amount / 1_000_000)}Tr`;
        return `Đầu tư ${amount.toLocaleString("vi-VN")}đ`;
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>Thu nhập & Hoa hồng</Text>
                <Text style={styles.headerSubtitle}>
                    Kỳ đối soát: Tháng {appliedMonth}/{appliedYear}
                </Text>
            </View>
            <TouchableOpacity onPress={openFilter} style={styles.filterButton}>
                <Ionicons name="calendar-outline" size={20} color="#0052CC" />
            </TouchableOpacity>
        </View>
    );

    const renderFilterModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isFilterVisible}
            onRequestClose={() => setFilterVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={styles.modalBackdrop} onPress={() => setFilterVisible(false)} />
                <View style={styles.bottomSheet}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.modalTitle}>Chọn kỳ đối soát</Text>

                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Năm</Text>
                        <View style={styles.grid}>
                            {years.map(year => (
                                <TouchableOpacity
                                    key={`year-${year}`}
                                    onPress={() => setTempYear(year)}
                                    style={[styles.filterBadge, styles.filterBadgeYear, tempYear === year && styles.filterBadgeActive]}
                                >
                                    <Text style={[styles.filterBadgeText, tempYear === year && styles.filterBadgeTextActive]}>
                                        {year}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Tháng</Text>
                        <View style={styles.grid}>
                            {months.map(month => (
                                <TouchableOpacity
                                    key={`month-${month}`}
                                    onPress={() => setTempMonth(month)}
                                    style={[styles.filterBadge, styles.filterBadgeMonth, tempMonth === month && styles.filterBadgeActive]}
                                >
                                    <Text style={[styles.filterBadgeText, tempMonth === month && styles.filterBadgeTextActive]}>
                                        Th. {month}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.btnCancel} onPress={() => setFilterVisible(false)}>
                            <Text style={styles.btnCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnApply} onPress={handleApplyFilter}>
                            <Text style={styles.btnApplyText}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {renderHeader()}
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#0052CC"]}
                        tintColor="#0052CC"
                    />
                }
            >
                {/* Thẻ Tổng Hoa Hồng */}
                <View style={styles.walletSection}>
                    <View style={styles.walletCard}>
                        <Text style={styles.walletLabel}>
                            Tổng tiền đã ghi nhận (Tháng {appliedMonth})
                        </Text>
                        {loading ? (
                            <ActivityIndicator color="#fff" size="large" style={{ marginTop: 8 }} />
                        ) : (
                            <Text style={styles.walletValueMain}>
                                {formatMoney(summary?.total_net)}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Lịch sử ghi nhận */}
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>Lịch sử ghi nhận</Text>

                    {loading ? (
                        <ActivityIndicator color="#0052CC" style={{ marginTop: 20 }} />
                    ) : commissions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-outline" size={48} color="#CBD5E0" />
                            <Text style={styles.emptyText}>
                                Không có hoa hồng trong tháng {appliedMonth}/{appliedYear}
                            </Text>
                        </View>
                    ) : (
                        commissions.map((item) => (
                            <View key={item._id} style={styles.historyItem}>
                                <View style={styles.historyIcon}>
                                    <Ionicons name="add-circle" size={28} color="#319795" />
                                </View>
                                <View style={styles.historyContent}>
                                    <Text style={styles.historyCustomer}>
                                        {getCustomerName(item)}
                                    </Text>
                                    <Text style={styles.historyDesc}>
                                        {formatAmountShort(item.amount)} - {item.term_value} {item.term_type === "month" ? "tháng" : "tuần"}
                                    </Text>
                                </View>
                                <View style={styles.historyRight}>
                                    <Text style={styles.historyAmount}>
                                        + {formatMoney(item.commission?.net_amount)}
                                    </Text>
                                    <Text style={styles.historyDate}>
                                        {dayjs(item.invested_at).format("DD/MM/YYYY")}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
            {renderFilterModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
    headerSubtitle: { fontSize: 14, color: '#718096', marginTop: 4 },
    filterButton: { backgroundColor: '#EBF4FF', padding: 10, borderRadius: 10 },
    container: { flex: 1 },
    walletSection: { padding: 20, paddingBottom: 10 },
    walletCard: {
        backgroundColor: '#0052CC', padding: 24, borderRadius: 16, alignItems: 'center',
        shadowColor: '#0052CC', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
    },
    walletLabel: { color: '#EBF4FF', fontSize: 15, marginBottom: 8 },
    walletValueMain: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold' },
    historyContainer: {
        flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24,
        borderTopRightRadius: 24, padding: 20, paddingTop: 24
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    historyItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EDF2F7'
    },
    historyIcon: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#E6FFFA',
        justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    historyContent: { flex: 1 },
    historyCustomer: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginBottom: 4 },
    historyDesc: { fontSize: 13, color: '#718096' },
    historyRight: { alignItems: 'flex-end' },
    historyAmount: { fontSize: 16, fontWeight: 'bold', color: '#319795', marginBottom: 4 },
    historyDate: { fontSize: 12, color: '#A0AEC0' },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, color: '#A0AEC0', marginTop: 12, textAlign: 'center' },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    bottomSheet: {
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 24,
        borderTopRightRadius: 24, padding: 24, paddingBottom: 40
    },
    sheetHandle: {
        width: 40, height: 5, backgroundColor: '#CBD5E0',
        borderRadius: 3, alignSelf: 'center', marginBottom: 16
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748', marginBottom: 20, textAlign: 'center' },
    filterSection: { marginBottom: 20 },
    filterLabel: { fontSize: 15, fontWeight: '600', color: '#4A5568', marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
    filterBadge: {
        paddingVertical: 10, margin: '1%', borderRadius: 8,
        borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#F7FAFC'
    },
    filterBadgeYear: { width: '31%' },
    filterBadgeMonth: { width: '23%' },
    filterBadgeActive: { backgroundColor: '#0052CC', borderColor: '#0052CC' },
    filterBadgeText: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
    filterBadgeTextActive: { color: '#FFFFFF', fontWeight: '700' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    btnCancel: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#EDF2F7', marginRight: 8, alignItems: 'center'
    },
    btnCancelText: { color: '#4A5568', fontSize: 16, fontWeight: '600' },
    btnApply: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#0052CC', marginLeft: 8, alignItems: 'center'
    },
    btnApplyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});