import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, FlatList, RefreshControl,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import useGetEmployeesInfinite from '../../hooks/hrm/useGetEmployeesInfinite';
import { ChevronLeft } from 'lucide-react-native';

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const EmployeeRow = ({ item }) => {
    const dept = item.departments?.[0];
    return (
        <View style={styles.row}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
            </View>
            <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{item.full_name || '—'}</Text>
                <Text style={styles.rowSub}>{item.ma_nv || '—'}</Text>
                {dept && (
                    <Text style={styles.rowDept} numberOfLines={1}>
                        {dept.department?.department_name ?? ''}
                        {dept.position?.position_name ? ` · ${dept.position.position_name}` : ''}
                    </Text>
                )}
            </View>
            <View style={[styles.typeBadge, item.employment_type === 'parttime' && styles.typeBadgePart]}>
                <Text style={[styles.typeText, item.employment_type === 'parttime' && styles.typeTextPart]}>
                    {item.employment_type === 'parttime' ? 'Part' : 'Full'}
                </Text>
            </View>
        </View>
    );
};

export default function EmployeeListScreen() {
    const navigation = useNavigation();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Debounce 400ms trước khi đổi query key để không bắn API liên tục khi đang gõ
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchInput]);

    const {
        data: infiniteData,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
    } = useGetEmployeesInfinite({ search });

    const employees = infiniteData?.pages.flatMap((p) => p.data ?? []) ?? [];

    const onRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <Header
                title="Cán bộ Nhân viên"
                LeftIcon={ChevronLeft}
                onLeftPress={() => navigation.goBack()}
            />

            {/* Tìm kiếm */}
            <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên, mã NV..."
                    placeholderTextColor="#9CA3AF"
                    value={searchInput}
                    onChangeText={setSearchInput}
                    returnKeyType="search"
                />
                {searchInput.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchInput('')}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#ED2E30" />
                </View>
            ) : (
                <FlatList
                    data={employees}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <EmployeeRow item={item} />}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#ED2E30']} tintColor="#ED2E30" />
                    }
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
                    onEndReachedThreshold={0.3}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="people-outline" size={44} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Không có nhân viên nào</Text>
                        </View>
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <ActivityIndicator size="small" color="#ED2E30" style={{ paddingVertical: 12 }} />
                        ) : null
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F6FA' },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 16,
        marginVertical: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8,
    },
    searchIcon: { flexShrink: 0 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
    emptyText: { fontSize: 14, color: '#9CA3AF' },
    listContent: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
    separator: { height: 1, backgroundColor: '#F3F4F6' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ED2E30',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    rowInfo: { flex: 1, gap: 2 },
    rowName: { fontSize: 14, fontWeight: '600', color: '#111827' },
    rowSub: { fontSize: 12, color: '#9CA3AF' },
    rowDept: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: '#D1FAE5',
    },
    typeBadgePart: { backgroundColor: '#FEF3C7' },
    typeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
    typeTextPart: { color: '#D97706' },
});
