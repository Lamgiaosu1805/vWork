import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/axiosInstance';
import Header from '../../components/Header';

export default function ListAgentScreen() {
    const navigation = useNavigation();

    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });

    const fetchAgents = async (page = 1, isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);

            const res = await api.get(`agents?app_code=tikluy&page=${page}&limit=20`, { requiresAuth: true });

            if (res.data?.data) {
                if (isRefresh || page === 1) {
                    setAgents(res.data.data);
                } else {
                    setAgents(prev => [...prev, ...res.data.data]);
                }

                if (res.data?.pagination) {
                    setPagination(res.data.pagination);
                }
            }
        } catch (error) {
            console.log("fetchAgents error:", error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAgents(1, true);
    };

    const loadMore = () => {
        if (!loading && pagination.page < pagination.total_pages) {
            fetchAgents(pagination.page + 1);
        }
    };

    const getAgentTypeName = (type) => {
        return type === 'ENTERPRISE' ? 'Doanh nghiệp' : 'Cá nhân';
    };

    const renderHeader = () => (
        <Header title="Danh sách đại lý" leftIconName="arrow-back" onLeftPress={() => navigation.goBack()} />
    );

    const renderAgentItem = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.agentTypeContainer}>
                    <Ionicons
                        name={item.agent_type === 'ENTERPRISE' ? 'business' : 'person'}
                        size={16}
                        color="#0052CC"
                    />
                    <Text style={styles.agentType}>{getAgentTypeName(item.agent_type)}</Text>
                </View>
                <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, item.is_active ? styles.textActive : styles.textInactive]}>
                        {item.is_active ? 'Hoạt động' : 'Đã khóa'}
                    </Text>
                </View>
            </View>

            <Text style={styles.agentName}>{item.full_name}</Text>
            <Text style={styles.agentCode}>Mã ĐL: {item.agent_code}</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#718096" />
                <Text style={styles.infoText}>{item.phone_number}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color="#718096" />
                <Text style={styles.infoText}>{item.email}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#718096" />
                <Text style={styles.infoText} numberOfLines={1}>{item.address} - {item.branch_name}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {renderHeader()}

            {loading && !refreshing && agents.length === 0 ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color="#0052CC" />
                </View>
            ) : (
                <FlatList
                    data={agents}
                    keyExtractor={(item) => item._id}
                    renderItem={renderAgentItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0052CC"]} />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color="#CBD5E0" />
                            <Text style={styles.emptyText}>Chưa có dữ liệu đại lý</Text>
                        </View>
                    }
                    ListFooterComponent={
                        (loading && agents.length > 0) ? (
                            <ActivityIndicator style={{ marginVertical: 20 }} color="#0052CC" />
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    agentTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    agentType: {
        fontSize: 12,
        color: '#0052CC',
        fontWeight: '600',
        marginLeft: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: {
        backgroundColor: '#E6FFFA',
    },
    statusInactive: {
        backgroundColor: '#FFF5F5',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    textActive: {
        color: '#319795',
    },
    textInactive: {
        color: '#E53E3E',
    },
    agentName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 4,
    },
    agentCode: {
        fontSize: 13,
        color: '#718096',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#4A5568',
        marginLeft: 8,
        flex: 1,
    },
    centerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        color: '#A0AEC0',
    }
});