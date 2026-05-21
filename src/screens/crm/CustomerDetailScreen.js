import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../api/axiosInstance';
import Header from '../../components/Header';

const STATUS_VI = {
    registered: 'Tiềm năng',
    kyc_pending: 'Chờ xét KYC',
    kyc_verified: 'Đã xác thực',
    kyc_rejected: 'KYC từ chối',
    active: 'Hoạt động',
    inactive: 'Ngừng',
    blocked: 'Bị khóa',
};

const STATUS_COLOR = {
    kyc_verified: '#059669',
    active: '#2563EB',
    registered: '#F59E0B',
    kyc_rejected: '#EF4444',
    blocked: '#EF4444',
    kyc_pending: '#F59E0B',
    inactive: '#9CA3AF',
};

const formatMoney = (v) => {
    if (!v) return '0 đ';
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} tỷ đ`;
    if (v >= 1_000_000) return `${Math.round(v / 1_000_000)} triệu đ`;
    return v.toLocaleString('vi-VN') + ' đ';
};

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// ─── AI Summary Card ────────────────────────────────────────────────────────

function AiSummaryCard({ customerId }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.get(`/ai/customer/${customerId}/summary`, { requiresAuth: true })
            .then((res) => setSummary(res.data?.summary ?? null))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [customerId]);

    return (
        <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={14} color="#2563EB" />
                <Text style={styles.aiTitle}>Phân tích AI</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 8 }} />
            ) : error || !summary ? (
                <Text style={styles.aiEmpty}>Không thể tải phân tích lúc này.</Text>
            ) : (
                <Text style={styles.aiText}>{summary}</Text>
            )}
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CustomerDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { customerId } = route.params ?? {};

    const [customer, setCustomer] = useState(null);
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!customerId) return;
        try {
            const [custRes, invRes] = await Promise.all([
                api.get(`/customer/${customerId}`, { requiresAuth: true }),
                api.get('/investments/list', { requiresAuth: true, params: { customer_id: customerId, limit: 5 } }),
            ]);
            setCustomer(custRes.data?.data ?? custRes.data ?? null);
            setInvestments(invRes.data?.data ?? []);
        } catch (err) {
            console.log('CustomerDetailScreen fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="Chi tiết khách hàng" leftIconName="arrow-back" onLeftPress={() => navigation.goBack()} />
                <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
            </View>
        );
    }

    const name = customer?.identity?.full_name ?? customer?.phone_number ?? 'Khách hàng';
    const status = customer?.status ?? 'registered';
    const totalActive = investments
        .filter(i => i.status === 'active')
        .reduce((s, i) => s + (i.amount || 0), 0);

    return (
        <View style={styles.container}>
            <Header title="Chi tiết khách hàng" leftIconName="arrow-back" onLeftPress={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

                {/* Profile header */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.profileName}>{name}</Text>
                        <Text style={styles.profilePhone}>{customer?.phone_number ?? '—'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[status] ?? '#9CA3AF') + '18' }]}>
                            <Text style={[styles.statusText, { color: STATUS_COLOR[status] ?? '#9CA3AF' }]}>
                                {STATUS_VI[status] ?? status}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* AI Summary */}
                {customerId && <AiSummaryCard customerId={customerId} />}

                {/* Thông tin cơ bản */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin</Text>
                    <InfoRow icon="card-outline" label="CCCD" value={customer?.identity?.id_number ?? '—'} />
                    <InfoRow icon="location-outline" label="Địa chỉ" value={customer?.identity?.address ?? '—'} />
                    <InfoRow icon="calendar-outline" label="Ngày tham gia" value={formatDate(customer?.createdAt)} />
                    <InfoRow icon="cash-outline" label="Đang đầu tư" value={formatMoney(totalActive)} />
                </View>

                {/* Khoản đầu tư gần đây */}
                {investments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Đầu tư gần đây</Text>
                        {investments.map((inv) => (
                            <View key={inv._id} style={styles.invRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.invName}>{inv.product_name}</Text>
                                    <Text style={styles.invMeta}>
                                        {formatMoney(inv.amount)} · {inv.interest_rate}%/năm · đáo hạn {formatDate(inv.maturity_at)}
                                    </Text>
                                </View>
                                <View style={[styles.invBadge, { backgroundColor: inv.status === 'active' ? '#DCFCE7' : '#F3F4F6' }]}>
                                    <Text style={[styles.invBadgeText, { color: inv.status === 'active' ? '#059669' : '#6B7280' }]}>
                                        {inv.status === 'active' ? 'Đang chạy' : inv.status === 'matured' ? 'Đáo hạn' : inv.status}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={16} color="#9CA3AF" style={{ width: 22 }} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
    profileName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    profilePhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
    statusText: { fontSize: 11, fontWeight: '700' },

    aiCard: {
        backgroundColor: '#EFF6FF',
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    aiTitle: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
    aiText: { fontSize: 13, color: '#374151', lineHeight: 20 },
    aiEmpty: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
    infoLabel: { fontSize: 13, color: '#6B7280', width: 90 },
    infoValue: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1 },

    invRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 10,
    },
    invName: { fontSize: 13, fontWeight: '600', color: '#111827' },
    invMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    invBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    invBadgeText: { fontSize: 11, fontWeight: '700' },
});
