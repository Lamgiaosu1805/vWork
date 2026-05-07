import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function KPIScreen() {
    const [currentMonth] = useState(5);

    // Giả lập data KPI
    const target = 500000000; // 500 triệu
    const currentSales = 350000000; // 350 triệu
    const progressPercent = (currentSales / target) * 100;

    const formatCurrency = (amount) => {
        return (amount / 1000000).toFixed(0) + ' Tr';
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>KPI & Hiệu suất</Text>
                <TouchableOpacity style={styles.monthBadge}>
                    <Text style={styles.monthBadgeText}>Tháng {currentMonth}</Text>
                    <Ionicons name="chevron-down" size={14} color="#0052CC" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >

                {/* Khối Tiến độ Doanh số */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tiến độ doanh số</Text>
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <View>
                                <Text style={styles.progressLabel}>Đạt được</Text>
                                <Text style={styles.currentSalesText}>{formatCurrency(currentSales)}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.progressLabel}>Mục tiêu</Text>
                                <Text style={styles.targetSalesText}>{formatCurrency(target)}</Text>
                            </View>
                        </View>

                        {/* Thanh Progress */}
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>

                        <View style={styles.progressFooter}>
                            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                            <Text style={styles.progressHint}>Còn thiếu {formatCurrency(target - currentSales)} để đạt chỉ tiêu</Text>
                        </View>
                    </View>
                </View>

                {/* Khối Phễu & Thống kê (Grid) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chỉ số hiệu suất</Text>
                    <View style={styles.gridContainer}>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#EBF4FF' }]}>
                                <Ionicons name="people" size={20} color="#0052CC" />
                            </View>
                            <Text style={styles.gridValue}>120</Text>
                            <Text style={styles.gridLabel}>Khách tiếp cận</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#E6FFFA' }]}>
                                <Ionicons name="person-add" size={20} color="#319795" />
                            </View>
                            <Text style={styles.gridValue}>45</Text>
                            <Text style={styles.gridLabel}>Mở tài khoản</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#FEFCBF' }]}>
                                <Ionicons name="pie-chart" size={20} color="#D69E2E" />
                            </View>
                            <Text style={styles.gridValue}>37.5%</Text>
                            <Text style={styles.gridLabel}>Tỉ lệ chuyển đổi</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#FFF5F5' }]}>
                                <Ionicons name="trophy" size={20} color="#E53E3E" />
                            </View>
                            <Text style={styles.gridValue}>Top 3</Text>
                            <Text style={styles.gridLabel}>Xếp hạng Team</Text>
                        </View>
                    </View>
                </View>

                {/* Khối Gợi ý hành động */}
                <View style={[styles.section, { paddingBottom: 30 }]}>
                    <View style={styles.actionHintCard}>
                        <Ionicons name="bulb-outline" size={24} color="#DD6B20" />
                        <View style={styles.actionHintContent}>
                            <Text style={styles.actionHintTitle}>Gợi ý hành động</Text>
                            <Text style={styles.actionHintDesc}>
                                Bạn có 5 khách hàng đang ngập ngừng chưa nạp tiền đầu tư. Hãy gọi điện hỗ trợ họ để chốt doanh số tuần này!
                            </Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
    monthBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    monthBadgeText: { color: '#0052CC', fontWeight: '600', fontSize: 14 },
    container: { flex: 1 },
    section: { paddingHorizontal: 20, paddingTop: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 12 },
    progressCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    progressLabel: { fontSize: 13, color: '#718096', marginBottom: 4 },
    currentSalesText: { fontSize: 24, fontWeight: 'bold', color: '#0052CC' },
    targetSalesText: { fontSize: 18, fontWeight: 'bold', color: '#4A5568' },
    progressBarBg: { height: 10, backgroundColor: '#EDF2F7', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#0052CC', borderRadius: 5 },
    progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    progressPercentText: { fontSize: 14, fontWeight: 'bold', color: '#2D3748' },
    progressHint: { fontSize: 12, color: '#E53E3E', fontWeight: '500' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    iconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    gridValue: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    gridLabel: { fontSize: 13, color: '#718096' },
    actionHintCard: { flexDirection: 'row', backgroundColor: '#FFFAF0', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FBD38D' },
    actionHintContent: { flex: 1, marginLeft: 12 },
    actionHintTitle: { fontSize: 15, fontWeight: 'bold', color: '#C05621', marginBottom: 4 },
    actionHintDesc: { fontSize: 13, color: '#DD6B20', lineHeight: 20 }
});