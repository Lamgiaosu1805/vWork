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
    },
    {
        id: 'agents',
        label: 'Quản lý\nđại lý',
        icon: 'briefcase',
        iconBg: '#EDE9FE',
        iconColor: '#7C3AED',
        screen: 'ListAgentScreen',
    },
    {
        id: 'team-commission',
        label: 'Thống kê\nhoa hồng',
        icon: 'pie-chart',
        iconBg: '#D1FAE5',
        iconColor: '#059669',
        screen: 'Commission',
    },
];

const PERSONAL_FEATURES = [
    {
        id: 'claim-request',
        label: 'Yêu cầu\nnhận KH',
        icon: 'hand-right',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        screen: 'ClaimRequestScreen',
    },
    {
        id: 'investment',
        label: 'Quản lý\nđầu tư',
        icon: 'trending-up',
        iconBg: '#D1FAE5',
        iconColor: '#059669',
        screen: 'InvestmentScreen',
    },
];

// ── Sub-components ─────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

const FeatureCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.cardIconBox, { backgroundColor: item.iconBg }]}>
            <Ionicons name={item.icon} size={24} color={item.iconColor} />
        </View>
        <Text style={styles.cardLabel} numberOfLines={2}>{item.label}</Text>
    </TouchableOpacity>
);

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
});
