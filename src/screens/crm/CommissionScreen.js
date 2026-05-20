import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    Modal, Pressable, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosInstance';
import Header from '../../components/Header';
import dayjs from 'dayjs';

const TYPE_CONFIG = {
    cif: { label: 'Mở CIF', bg: '#DBEAFE', color: '#1D4ED8' },
    ekyc: { label: 'eKYC', bg: '#D1FAE5', color: '#059669' },
    investment: { label: 'Đầu tư', bg: '#F3E8FF', color: '#7C3AED' },
};

function TypeBadge({ type }) {
    const cfg = TYPE_CONFIG[type];
    return (
        <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}

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
    const [ccSummary, setCcSummary] = useState(null);
    const [customerCommissions, setCustomerCommissions] = useState([]);

    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const years = [2025, 2026, 2027];

    const fetchCommission = useCallback(async (month, year) => {
        try {
            const res = await api.get(
                `investments/my-commission?month=${month}&year=${year}`,
                { requiresAuth: true }
            );
            setSummary(res.data?.summary ?? null);
            setCommissions(res.data?.data ?? []);
            setCcSummary(res.data?.customer_commission_summary ?? null);
            setCustomerCommissions(res.data?.customer_commissions ?? []);
        } catch (error) {
            console.log("fetchCommission error:", error.response?.data || error.message);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchCommission(appliedMonth, appliedYear);
            setLoading(false);
        };
        load();
    }, [appliedMonth, appliedYear]);

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

    const formatMoney = (amount) => {
        if (!amount) return "0 đ";
        return amount.toLocaleString("vi-VN") + " đ";
    };

    const formatAmountShort = (amount) => {
        if (!amount) return "";
        if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Tỷ`;
        if (amount >= 1_000_000) return `${Math.round(amount / 1_000_000)} Tr`;
        return amount.toLocaleString("vi-VN") + " đ";
    };

    const totalNet = (summary?.total_net ?? 0) + (ccSummary?.total_amount ?? 0);

    const historyItems = useMemo(() => {
        const items = [];
        customerCommissions.forEach((c) => {
            if (c.cif_commission?.sale_id) {
                items.push({
                    key: `cif-${c._id}`,
                    type: 'cif',
                    date: c.cif_commission.granted_at,
                    customerName: c.identity?.full_name || null,
                    phone: c.phone_number,
                    detail: 'Mở tài khoản',
                    amount: c.cif_commission.amount,
                });
            }
            if (c.ekyc_commission?.sale_id) {
                items.push({
                    key: `ekyc-${c._id}`,
                    type: 'ekyc',
                    date: c.ekyc_commission.granted_at,
                    customerName: c.identity?.full_name || null,
                    phone: c.phone_number,
                    detail: 'eKYC thành công',
                    amount: c.ekyc_commission.amount,
                });
            }
        });
        commissions.forEach((item) => {
            const termLabel = item.term_value
                ? `${item.term_value} ${item.term_type === 'month' ? 'tháng' : 'ngày'}`
                : null;
            items.push({
                key: `inv-${item._id}`,
                type: 'investment',
                date: item.invested_at,
                customerName: item.customer_id?.identity?.full_name || null,
                phone: item.customer_id?.phone_number,
                detail: [item.product_name, formatAmountShort(item.amount), termLabel].filter(Boolean).join(' · '),
                amount: item.commission?.net_amount ?? 0,
            });
        });
        return items.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [customerCommissions, commissions]);

    const renderHeader = () => (
        <Header
            title="Thu nhập & Hoa hồng"
            rightIconName="calendar-outline"
            onRightPress={openFilter}
        />
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
        <View style={styles.safeArea}>
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
                            Tổng hoa hồng ghi nhận — Tháng {appliedMonth}/{appliedYear}
                        </Text>
                        {loading ? (
                            <ActivityIndicator color="#fff" size="large" style={{ marginTop: 8 }} />
                        ) : (
                            <Text style={styles.walletValueMain}>
                                {formatMoney(totalNet)}
                            </Text>
                        )}
                    </View>
                </View>

                {/* HH CIF / eKYC mini-cards */}
                {!loading && (
                    <View style={styles.ccRow}>
                        <View style={[styles.ccCard, { borderLeftColor: '#2563EB' }]}>
                            <Ionicons name="person-add-outline" size={20} color="#2563EB" />
                            <Text style={styles.ccLabel}>HH mở CIF</Text>
                            <Text style={[styles.ccAmount, { color: '#2563EB' }]}>
                                {formatMoney(ccSummary?.cif_amount ?? 0)}
                            </Text>
                            <Text style={styles.ccCount}>{ccSummary?.cif_count ?? 0} khách</Text>
                        </View>
                        <View style={[styles.ccCard, { borderLeftColor: '#059669' }]}>
                            <Ionicons name="finger-print-outline" size={20} color="#059669" />
                            <Text style={styles.ccLabel}>HH eKYC</Text>
                            <Text style={[styles.ccAmount, { color: '#059669' }]}>
                                {formatMoney(ccSummary?.ekyc_amount ?? 0)}
                            </Text>
                            <Text style={styles.ccCount}>{ccSummary?.ekyc_count ?? 0} khách</Text>
                        </View>
                    </View>
                )}

                {/* Lịch sử cộng hoa hồng */}
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>Lịch sử cộng hoa hồng</Text>
                    {loading ? (
                        <ActivityIndicator color="#0052CC" style={{ marginTop: 20 }} />
                    ) : historyItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-outline" size={48} color="#CBD5E0" />
                            <Text style={styles.emptyText}>
                                Không có hoa hồng trong tháng {appliedMonth}/{appliedYear}
                            </Text>
                        </View>
                    ) : (
                        historyItems.map((item) => (
                            <View key={item.key} style={styles.historyItem}>
                                <View style={styles.historyLeft}>
                                    <TypeBadge type={item.type} />
                                    <Text style={styles.historyCustomer} numberOfLines={1}>
                                        {item.customerName || 'Chưa eKYC'}
                                    </Text>
                                    <Text style={styles.historyPhone}>{item.phone}</Text>
                                    {!!item.detail && (
                                        <Text style={styles.historyDesc} numberOfLines={2}>{item.detail}</Text>
                                    )}
                                </View>
                                <View style={styles.historyRight}>
                                    <Text style={[styles.historyAmount, { color: TYPE_CONFIG[item.type].color }]}>
                                        +{formatMoney(item.amount)}
                                    </Text>
                                    <Text style={styles.historyDate}>
                                        {item.date ? dayjs(item.date).format('DD/MM/YYYY') : '—'}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
            {renderFilterModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
    filterButton: { backgroundColor: '#EBF4FF', padding: 10, borderRadius: 10 },
    container: { flex: 1 },
    walletSection: { padding: 20, paddingBottom: 10 },
    walletCard: {
        backgroundColor: '#0052CC', padding: 24, borderRadius: 16, alignItems: 'center',
        shadowColor: '#0052CC', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
    },
    walletLabel: { color: '#EBF4FF', fontSize: 14, marginBottom: 8, textAlign: 'center' },
    walletValueMain: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold' },
    historyContainer: {
        flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24,
        borderTopRightRadius: 24, padding: 20, paddingTop: 24
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    historyItem: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDF2F7'
    },
    historyLeft: { flex: 1, marginRight: 8 },
    historyCustomer: { fontSize: 14, fontWeight: '600', color: '#2D3748', marginTop: 6, marginBottom: 2 },
    historyPhone: { fontSize: 12, color: '#A0AEC0', marginBottom: 2 },
    historyDesc: { fontSize: 12, color: '#718096' },
    historyRight: { alignItems: 'flex-end', flexShrink: 0 },
    historyAmount: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    historyDate: { fontSize: 12, color: '#A0AEC0' },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, color: '#A0AEC0', marginTop: 12, textAlign: 'center' },
    typeBadge: {
        alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    typeBadgeText: { fontSize: 11, fontWeight: '700' },
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
    ccRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
    ccCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
        borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    ccLabel: { fontSize: 11, color: '#718096', fontWeight: '600', marginTop: 6, marginBottom: 2 },
    ccAmount: { fontSize: 16, fontWeight: '800' },
    ccCount: { fontSize: 11, color: '#A0AEC0', marginTop: 2 },
});
