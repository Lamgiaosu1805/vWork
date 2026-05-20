import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, StyleSheet,
    ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { canMgr } from '../../helpers/permissions';
import api from '../../api/axiosInstance';
import Header from '../../components/Header';

const PRIMARY = '#0052CC';

const STATUS_CONFIG = {
    active:           { label: 'Đang hoạt động', bg: '#D1FAE5', color: '#059669' },
    matured:          { label: 'Đã đáo hạn',     bg: '#F3F4F6', color: '#6B7280' },
    cancelled:        { label: 'Đã hủy',          bg: '#FEE2E2', color: '#DC2626' },
    renewed:          { label: 'Tái tục',          bg: '#DBEAFE', color: '#2563EB' },
    early_terminated: { label: 'Tất toán sớm',    bg: '#FEF3C7', color: '#D97706' },
};

const ALL_STATUSES = [
    { value: '', label: 'Tất cả' },
    ...Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label })),
];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const YEARS = [2024, 2025, 2026, 2027];

function StatusChip({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#F3F4F6', color: '#6B7280' };
    return (
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}

const formatMoney = (amount) =>
    amount ? amount.toLocaleString('vi-VN') + ' đ' : '—';

const formatDate = (val) =>
    val ? dayjs(val).format('DD/MM/YYYY') : '—';

const formatTerm = (value, type) => {
    if (!value) return '—';
    return type === 'month' ? `${value} tháng` : `${value} ngày`;
};

// ── Filter bottom sheet ────────────────────────────────────────────────────

function FilterSheet({ visible, onClose, applied, onApply }) {
    const [status, setStatus] = useState(applied.status);
    const [month, setMonth] = useState(applied.month);
    const [year, setYear] = useState(applied.year);

    const handleApply = () => {
        onApply({ status, month, year });
        onClose();
    };

    const handleReset = () => {
        setStatus('');
        setMonth(null);
        setYear(null);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.sheetOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.sheetHandle} />
                    <View style={styles.sheetHeaderRow}>
                        <Text style={styles.sheetTitle}>Bộ lọc</Text>
                        <TouchableOpacity onPress={handleReset}>
                            <Text style={styles.resetText}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Trạng thái */}
                    <Text style={styles.filterLabel}>Trạng thái</Text>
                    <View style={styles.chipRow}>
                        {ALL_STATUSES.map((s) => (
                            <TouchableOpacity
                                key={s.value}
                                style={[styles.chip, status === s.value && styles.chipActive]}
                                onPress={() => setStatus(s.value)}
                            >
                                <Text style={[styles.chipText, status === s.value && styles.chipTextActive]}>
                                    {s.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Năm */}
                    <Text style={[styles.filterLabel, { marginTop: 16 }]}>Năm đầu tư</Text>
                    <View style={styles.chipRow}>
                        {YEARS.map((y) => (
                            <TouchableOpacity
                                key={y}
                                style={[styles.chip, styles.chipWide, year === y && styles.chipActive]}
                                onPress={() => setYear(year === y ? null : y)}
                            >
                                <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tháng */}
                    {year && (
                        <>
                            <Text style={[styles.filterLabel, { marginTop: 16 }]}>Tháng đầu tư</Text>
                            <View style={styles.chipRow}>
                                {MONTHS.map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.chip, month === m && styles.chipActive]}
                                        onPress={() => setMonth(month === m ? null : m)}
                                    >
                                        <Text style={[styles.chipText, month === m && styles.chipTextActive]}>
                                            Th.{m}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    <View style={styles.sheetActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                            <Text style={styles.applyBtnText}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function InvestmentScreen() {
    const navigation = useNavigation();
    const user = useSelector((state) => state.auth.user);
    const isManager = canMgr(user, 'crm');

    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [filterVisible, setFilterVisible] = useState(false);
    const loadingRef = useRef(false);

    const [applied, setApplied] = useState({ status: '', month: null, year: null });

    const buildParams = useCallback((p, filter) => {
        const params = { page: p, limit: 15, ...(filter.status && { status: filter.status }) };
        if (filter.year) {
            const m = filter.month ?? null;
            if (m) {
                const from = dayjs(`${filter.year}-${String(m).padStart(2, '0')}-01`);
                params.date_from = from.format('YYYY-MM-DD');
                params.date_to = from.endOf('month').format('YYYY-MM-DD');
            } else {
                params.date_from = `${filter.year}-01-01`;
                params.date_to = `${filter.year}-12-31`;
            }
        }
        return params;
    }, []);

    const fetchData = useCallback(async (p = 1, reset = false, filter = applied) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const res = await api.get('/investments/list', {
                params: buildParams(p, filter),
                requiresAuth: true,
            });
            const items = res.data?.data ?? [];
            const pagination = res.data?.pagination ?? {};
            setInvestments((prev) => {
                if (reset) return items;
                const ids = new Set(prev.map((i) => i._id));
                return [...prev, ...items.filter((i) => !ids.has(i._id))];
            });
            setHasMore(p < (pagination.total_pages ?? 1));
            setTotal(pagination.total ?? 0);
            setPage(p);
        } catch (err) {
            console.log('InvestmentScreen fetch error:', err?.response?.data || err.message);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [applied, buildParams]);

    useEffect(() => {
        fetchData(1, true);
    }, []);

    const handleApplyFilter = (filter) => {
        setApplied(filter);
        fetchData(1, true, filter);
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) fetchData(page + 1, false);
    };

    const hasFilter = applied.status || applied.year;

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.customerName} numberOfLines={1}>
                        {item.customer_id?.identity?.full_name || 'Chưa eKYC'}
                    </Text>
                    <Text style={styles.customerPhone}>{item.customer_id?.phone_number}</Text>
                </View>
                <StatusChip status={item.status} />
            </View>

            <Text style={styles.productName}>{item.product_name}</Text>

            <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>Số tiền</Text>
                    <Text style={styles.infoValue}>{formatMoney(item.amount)}</Text>
                </View>
                <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>Kỳ hạn</Text>
                    <Text style={styles.infoValue}>{formatTerm(item.term_value, item.term_type)}</Text>
                </View>
                <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>Lãi suất</Text>
                    <Text style={styles.infoValue}>{item.interest_rate ? `${item.interest_rate}%/năm` : '—'}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>Ngày đầu tư</Text>
                    <Text style={styles.infoValue}>{formatDate(item.invested_at)}</Text>
                </View>
                <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>Đáo hạn</Text>
                    <Text style={styles.infoValue}>{formatDate(item.maturity_at)}</Text>
                </View>
                {item.commission?.net_amount > 0 && (
                    <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>HH dự kiến</Text>
                        <Text style={[styles.infoValue, { color: '#059669' }]}>
                            {formatMoney(item.commission.net_amount)}
                        </Text>
                    </View>
                )}
            </View>

            {isManager && item.commission?.sale_id && (
                <Text style={styles.saleLabel}>
                    Sale: {item.commission.sale_id.full_name}
                    {item.commission.sale_id.ma_nv ? ` · ${item.commission.sale_id.ma_nv}` : ''}
                </Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <Header
                title="Quản lý đầu tư"
                leftIconName="arrow-back"
                onLeftPress={() => navigation.goBack()}
                rightIconName="options-outline"
                onRightPress={() => setFilterVisible(true)}
            />

            {/* Tổng số */}
            {!loading && (
                <View style={styles.totalBar}>
                    <Text style={styles.totalText}>{total} khoản đầu tư</Text>
                    {hasFilter && (
                        <TouchableOpacity onPress={() => handleApplyFilter({ status: '', month: null, year: null })}>
                            <Text style={styles.clearText}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {loading && investments.length === 0 ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={investments}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onRefresh={() => fetchData(1, true)}
                    refreshing={loading && page === 1}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={
                        <View style={styles.centerBox}>
                            <Ionicons name="document-outline" size={48} color="#CBD5E0" />
                            <Text style={styles.emptyText}>Không có khoản đầu tư nào</Text>
                        </View>
                    }
                    ListFooterComponent={loading && page > 1
                        ? <ActivityIndicator color={PRIMARY} style={{ marginVertical: 16 }} />
                        : null
                    }
                />
            )}

            <FilterSheet
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                applied={applied}
                onApply={handleApplyFilter}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },

    filterBtn: {
        padding: 9, borderRadius: 10, backgroundColor: '#EBF4FF',
        alignItems: 'center', justifyContent: 'center', position: 'relative',
    },
    filterBtnActive: { backgroundColor: PRIMARY },
    filterDot: {
        position: 'absolute', top: 6, right: 6,
        width: 7, height: 7, borderRadius: 4, backgroundColor: '#ED2E30',
    },

    totalBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    totalText: { fontSize: 13, color: '#6B7280' },
    clearText: { fontSize: 13, color: PRIMARY, fontWeight: '600' },

    listContent: { padding: 16, gap: 12, flexGrow: 1 },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6, elevation: 2,
    },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
    customerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    customerPhone: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    productName: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12 },

    infoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    infoCell: { flex: 1 },
    infoLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2, fontWeight: '500' },
    infoValue: { fontSize: 13, fontWeight: '700', color: '#111827' },

    saleLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 0 },
    statusText: { fontSize: 11, fontWeight: '700' },

    // Filter sheet
    sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40,
    },
    sheetHandle: { width: 40, height: 5, backgroundColor: '#CBD5E0', borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
    sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748' },
    resetText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },

    filterLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 10 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
        borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F7FAFC',
    },
    chipWide: { minWidth: 64, alignItems: 'center' },
    chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    chipText: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
    chipTextActive: { color: '#fff', fontWeight: '700' },

    sheetActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EDF2F7', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#4A5568' },
    applyBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: PRIMARY, alignItems: 'center' },
    applyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12, textAlign: 'center' },
});
