import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../api/axiosInstance';

const { width: SCREEN_W } = Dimensions.get('window');

const PERIOD_TABS = [
    { value: 'day',   label: '30 ngày' },
    { value: 'week',  label: '12 tuần' },
    { value: 'month', label: '12 tháng' },
];

const MODE_LABEL = {
    personal:   'Doanh số của tôi',
    department: 'Doanh số phòng ban',
    branch:     'Doanh số chi nhánh',
    all:        'Doanh số toàn hệ thống',
};

const formatMoney = (v) => {
    if (!v) return '0 đ';
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} Tỷ`;
    if (v >= 1_000_000) return `${Math.round(v / 1_000_000)} Tr`;
    return v.toLocaleString('vi-VN');
};

const formatYAxis = (v) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(0)}T`;
    if (v >= 1_000_000) return `${Math.round(v / 1_000_000)}M`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
    return `${v}`;
};

// Với 30 ngày: hiện label mỗi 5 điểm, còn lại để trống
const buildLabel = (s, idx, period) => {
    if (period === 'day') {
        return idx % 5 === 0 ? s.label.split('/')[0] : '';
    }
    return s.label.replace('Th ', 'T');
};

export default function SalesSummaryChart({ isAdmin }) {
    const [period, setPeriod]           = useState('week');
    const [chartData, setChartData]     = useState(null);
    const [loading, setLoading]         = useState(true);
    const [branches, setBranches]       = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);

    useEffect(() => {
        if (!isAdmin) return;
        api.get('/branch/getAll', { requiresAuth: true })
            .then((res) => setBranches(res.data?.data ?? []))
            .catch(() => {});
    }, [isAdmin]);

    const fetchChart = useCallback(async (p, branchId) => {
        setLoading(true);
        try {
            const params = { period: p };
            if (branchId) params.branch_id = branchId;
            const res = await api.get('/investments/sales-chart', { requiresAuth: true, params });
            setChartData(res.data);
        } catch (err) {
            console.log('SalesSummaryChart error:', err?.message);
            setChartData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChart(period, selectedBranch?._id ?? null);
    }, [period, selectedBranch, fetchChart]);

    const openBranchPicker = () => {
        Alert.alert('Chọn chi nhánh', null, [
            { text: 'Tất cả chi nhánh', onPress: () => setSelectedBranch(null) },
            ...branches.map((b) => ({
                text: b.branch_name,
                onPress: () => setSelectedBranch(b),
            })),
            { text: 'Huỷ', style: 'cancel' },
        ]);
    };

    const series    = chartData?.series ?? [];
    const breakdown = chartData?.breakdown ?? [];
    const summary   = chartData?.summary ?? {};
    const mode      = chartData?.mode ?? 'personal';
    const hasData   = series.some((s) => s.amount > 0);

    // Tính kích thước bar sao cho vừa màn hình hoặc scroll được
    const CHART_INNER_W = SCREEN_W - 32 - 50; // card padding + yAxis
    const pointCount    = series.length || 1;
    // Cố định barWidth theo period
    const barWidth   = period === 'day' ? 14 : period === 'week' ? 18 : 22;
    const barSpacing = period === 'day' ? 6  : period === 'week' ? 14 : 22;
    const totalBarW  = pointCount * (barWidth + barSpacing);
    // Scroll khi chart lớn hơn màn hình
    const needsScroll = totalBarW > CHART_INNER_W;

    const barData = series.map((s, idx) => ({
        value: s.amount,
        label: buildLabel(s, idx, period),
        frontColor: s.amount > 0 ? '#2563EB' : '#E5E7EB',
        topLabelComponent: () => null, // ẩn label trên đầu bar
    }));

    const maxVal = Math.max(...series.map((s) => s.amount), 1);

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.cardTitle}>{MODE_LABEL[mode] ?? 'Doanh số'}</Text>
                {isAdmin && (
                    <TouchableOpacity style={styles.branchBtn} onPress={openBranchPicker} activeOpacity={0.7}>
                        <Ionicons name="business-outline" size={13} color="#2563EB" />
                        <Text style={styles.branchBtnText} numberOfLines={1}>
                            {selectedBranch?.branch_name ?? 'Tất cả CN'}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color="#2563EB" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Period tabs */}
            <View style={styles.tabRow}>
                {PERIOD_TABS.map((t) => (
                    <TouchableOpacity
                        key={t.value}
                        style={[styles.tab, period === t.value && styles.tabActive]}
                        onPress={() => setPeriod(t.value)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, period === t.value && styles.tabTextActive]}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Summary cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={styles.summaryLabel}>Tổng doanh số</Text>
                    {loading ? (
                        <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 4 }} />
                    ) : (
                        <Text style={[styles.summaryValue, { color: '#1D4ED8' }]}>
                            {formatMoney(summary.total_amount)} đ
                        </Text>
                    )}
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.summaryLabel, { color: '#065F46' }]}>Số giao dịch</Text>
                    {loading ? (
                        <ActivityIndicator size="small" color="#059669" style={{ marginTop: 4 }} />
                    ) : (
                        <Text style={[styles.summaryValue, { color: '#059669' }]}>
                            {summary.total_count ?? 0}
                        </Text>
                    )}
                </View>
            </View>

            {/* Bar Chart */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : !hasData ? (
                <View style={styles.emptyBox}>
                    <Ionicons name="bar-chart-outline" size={40} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Chưa có doanh số trong kỳ này</Text>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={needsScroll}
                    style={styles.chartScroll}
                    contentContainerStyle={{ paddingRight: 16 }}
                >
                    <BarChart
                        data={barData}
                        barWidth={barWidth}
                        spacing={barSpacing}
                        height={160}
                        maxValue={maxVal * 1.15}
                        noOfSections={4}
                        frontColor="#2563EB"
                        gradientColor="#93C5FD"
                        showGradient
                        yAxisTextStyle={styles.yAxisText}
                        xAxisLabelTextStyle={styles.xAxisText}
                        xAxisThickness={1}
                        xAxisColor="#F3F4F6"
                        yAxisThickness={0}
                        yAxisLabelFormatter={formatYAxis}
                        hideRules={false}
                        rulesColor="#F3F4F6"
                        rulesType="solid"
                        isAnimated
                        animationDuration={400}
                        renderTooltip={(item) =>
                            item.value > 0 ? (
                                <View style={styles.tooltip}>
                                    <Text style={styles.tooltipValue}>{formatMoney(item.value)}</Text>
                                </View>
                            ) : null
                        }
                    />
                </ScrollView>
            )}

            {/* Ghi chú scroll cho 30 ngày */}
            {!loading && hasData && period === 'day' && needsScroll && (
                <Text style={styles.scrollHint}>← Vuốt ngang để xem toàn bộ →</Text>
            )}

            {/* Breakdown ranking */}
            {!loading && breakdown.length > 0 && (
                <View style={styles.breakdown}>
                    <Text style={styles.breakdownTitle}>
                        {mode === 'all' ? 'Theo chi nhánh' : 'Xếp hạng thành viên'}
                    </Text>
                    {breakdown.slice(0, 5).map((item, idx) => {
                        const max = breakdown[0]?.amount || 1;
                        const pct = Math.round((item.amount / max) * 100);
                        return (
                            <View key={idx} style={styles.rankRow}>
                                <View style={styles.rankLeft}>
                                    <Text style={styles.rankNum}>{idx + 1}</Text>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.rankInfo}>
                                            <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>
                                            <Text style={styles.rankAmount}>{formatMoney(item.amount)} đ</Text>
                                        </View>
                                        <View style={styles.rankBar}>
                                            <View style={[
                                                styles.rankBarFill,
                                                { width: `${pct}%`, backgroundColor: idx === 0 ? '#2563EB' : '#93C5FD' }
                                            ]} />
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.rankCount}>{item.count} GD</Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 16,
        paddingVertical: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
    branchBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, maxWidth: 140,
    },
    branchBtnText: { fontSize: 12, color: '#2563EB', fontWeight: '600', flexShrink: 1 },

    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
    tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
    tabActive: { backgroundColor: '#2563EB' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    tabTextActive: { color: '#fff' },

    summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
    summaryCard: { flex: 1, borderRadius: 12, padding: 12 },
    summaryLabel: { fontSize: 11, fontWeight: '600', color: '#1E40AF', marginBottom: 4 },
    summaryValue: { fontSize: 16, fontWeight: '800' },

    loadingBox: { height: 160, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { height: 140, justifyContent: 'center', alignItems: 'center', gap: 8 },
    emptyText: { fontSize: 13, color: '#9CA3AF' },

    chartScroll: { paddingLeft: 16 },
    yAxisText: { fontSize: 10, color: '#9CA3AF' },
    xAxisText: { fontSize: 9, color: '#6B7280', textAlign: 'center', width: 28 },
    tooltip: {
        backgroundColor: '#1E40AF', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4,
    },
    tooltipValue: { fontSize: 10, color: '#fff', fontWeight: '800' },
    scrollHint: {
        textAlign: 'center', fontSize: 11, color: '#9CA3AF',
        marginTop: 4, marginBottom: 2,
    },

    breakdown: {
        paddingHorizontal: 16, paddingTop: 4,
        borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 8,
    },
    breakdownTitle: {
        fontSize: 11, fontWeight: '700', color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 10, marginTop: 10,
    },
    rankRow: {
        flexDirection: 'row', alignItems: 'center',
        gap: 8, marginBottom: 10,
    },
    rankLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    rankNum: { fontSize: 13, fontWeight: '800', color: '#9CA3AF', width: 16, textAlign: 'center' },
    rankInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    rankName: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1, marginRight: 4 },
    rankAmount: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
    rankBar: { height: 5, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' },
    rankBarFill: { height: '100%', borderRadius: 4 },
    rankCount: { fontSize: 11, color: '#9CA3AF', width: 32, textAlign: 'right' },
});
