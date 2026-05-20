import React from 'react';
import {
    StyleSheet, Text, View, ScrollView,
    TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Header from '../../components/Header';
import { getPermissions } from '../../helpers/permissions';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

// ── Cấu hình tính năng ─────────────────────────────────────────────────────
const MANAGER_FEATURES = [
    {
        id: 'all-customers',
        label: 'Tất cả\nkhách hàng',
        icon: 'people',
        iconBg: '#DBEAFE',
        iconColor: '#2563EB',
        screen: 'AdminCustomerScreen',
        available: true,
    },
    {
        id: 'agents',
        label: 'Quản lý\nđại lý',
        icon: 'briefcase',
        iconBg: '#EDE9FE',
        iconColor: '#7C3AED',
        screen: 'ListAgentScreen',
        available: true,
    },
    {
        id: 'team-commission',
        label: 'Thống kê\nhoa hồng',
        icon: 'pie-chart',
        iconBg: '#D1FAE5',
        iconColor: '#059669',
        screen: null,
        available: false,
    },
    {
        id: 'team-manage',
        label: 'Quản lý\nTeam',
        icon: 'git-network',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        screen: null,
        available: false,
    },
    {
        id: 'approve',
        label: 'Phê duyệt\nyêu cầu KH',
        icon: 'checkmark-circle',
        iconBg: '#FCE7F3',
        iconColor: '#DB2777',
        screen: null,
        available: false,
    },
    {
        id: 'reports',
        label: 'Báo cáo\nbán hàng',
        icon: 'bar-chart',
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        screen: null,
        available: false,
    },
];

const PERSONAL_FEATURES = [
    {
        id: 'sales-kit',
        label: 'Kho tài liệu\n(Sales Kit)',
        icon: 'folder-open',
        iconBg: '#DBEAFE',
        iconColor: '#2563EB',
        screen: null,
        available: false,
    },
    {
        id: 'schedule',
        label: 'Lịch hẹn\n& Nhắc việc',
        icon: 'calendar',
        iconBg: '#D1FAE5',
        iconColor: '#059669',
        screen: null,
        available: false,
    },
    {
        id: 'claim-request',
        label: 'Yêu cầu\nnhận KH',
        icon: 'hand-right',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        screen: 'ClaimRequestScreen',
        available: true,
    },
    {
        id: 'investment',
        label: 'Quản lý\nđầu tư',
        icon: 'trending-up',
        iconBg: '#D1FAE5',
        iconColor: '#059669',
        screen: 'InvestmentScreen',
        available: true,
    },
    {
        id: 'my-report',
        label: 'Báo cáo\ncá nhân',
        icon: 'stats-chart',
        iconBg: '#FCE7F3',
        iconColor: '#DB2777',
        screen: null,
        available: false,
    },
];

// ── Sub-components ─────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

const FeatureCard = ({ item, onPress }) => {
    const disabled = !item.available;
    return (
        <TouchableOpacity
            style={[styles.card, disabled && styles.cardDisabled]}
            onPress={disabled ? undefined : onPress}
            activeOpacity={disabled ? 1 : 0.7}
        >
            <View style={[styles.cardIconBox, { backgroundColor: disabled ? '#F3F4F6' : item.iconBg }]}>
                <Ionicons
                    name={item.icon}
                    size={24}
                    color={disabled ? '#D1D5DB' : item.iconColor}
                />
            </View>
            <Text style={[styles.cardLabel, disabled && styles.cardLabelDisabled]} numberOfLines={2}>
                {item.label}
            </Text>
            {disabled && (
                <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Sắp có</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// ── Main ────────────────────────────────────────────────────────────────────
export default function ExpandCRMScreen() {
    const navigation = useNavigation();
    const user = useSelector(state => state.auth.user);
    const perms = getPermissions(user);
    const isManager = perms.showCustomerAll;

    const handlePress = (screen) => {
        if (screen) navigation.navigate(screen);
    };

    return (
        <View style={styles.safeArea}>
            <Header title="Mở rộng" />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Tính năng quản lý ── */}
                {isManager && (
                    <View style={styles.section}>
                        <SectionHeader title="QUẢN LÝ" />
                        <View style={styles.grid}>
                            {MANAGER_FEATURES.map((item) => (
                                <FeatureCard
                                    key={item.id}
                                    item={item}
                                    onPress={() => handlePress(item.screen)}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Công cụ cá nhân ── */}
                <View style={styles.section}>
                    <SectionHeader title="CÔNG CỤ CÁ NHÂN" />
                    <View style={styles.grid}>
                        {PERSONAL_FEATURES.map((item) => (
                            <FeatureCard
                                key={item.id}
                                item={item}
                                onPress={() => handlePress(item.screen)}
                            />
                        ))}
                    </View>
                </View>

                {/* ── Thông tin phiên bản ── */}
                <View style={styles.footer}>
                    <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.footerText}>
                        Các tính năng "Sắp có" đang được phát triển và sẽ sớm khả dụng.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },


    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 80 },

    section: { marginTop: 20, paddingHorizontal: 16 },
    sectionTitle: {
        fontSize: 12, fontWeight: '700', color: '#9CA3AF',
        letterSpacing: 0.8, marginBottom: 12, marginLeft: 2,
    },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

    card: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    cardDisabled: {
        backgroundColor: '#FAFAFA',
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 20,
    },
    cardLabelDisabled: { color: '#9CA3AF' },

    comingSoonBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    comingSoonText: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },

    footer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 28,
        padding: 14,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    footerText: { flex: 1, fontSize: 12, color: '#9CA3AF', lineHeight: 18 },
});
