import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function ExpandCRMScreen() {
    const [notifyNewCustomer, setNotifyNewCustomer] = useState(true);
    const [notifyInvestment, setNotifyInvestment] = useState(true);

    const renderMenuItem = (title, iconName, isDestructive = false) => (
        <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={iconName} size={22} color={isDestructive ? '#FF3B30' : '#4A5568'} />
                <Text style={[styles.menuItemText, isDestructive && { color: '#FF3B30' }]}>
                    {title}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
        </TouchableOpacity>
    );

    const renderSwitchItem = (title, iconName, value, onValueChange) => (
        <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={iconName} size={22} color="#4A5568" />
                <Text style={styles.menuItemText}>{title}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: "#CBD5E0", true: "#0052CC" }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    const renderSection = (title, children) => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                {renderSection('KINH DOANH', (
                    <>
                        {renderMenuItem('Lịch hẹn & Nhắc lịch', 'calendar-outline')}
                        {renderMenuItem('Kho tài liệu (Sales Kit)', 'folder-open-outline')}
                        {renderMenuItem('Báo cáo cá nhân', 'bar-chart-outline')}
                    </>
                ))}

                {renderSection('CÔNG CỤ & TIỆN ÍCH', (
                    <>
                        {renderMenuItem('Ghi chú nhanh', 'document-text-outline')}
                        {renderMenuItem('Hỗ trợ (Ticket)', 'headset-outline')}
                        {renderMenuItem('Danh bạ nội bộ', 'people-outline')}
                    </>
                ))}

                {renderSection('QUẢN TRỊ HỆ THỐNG', (
                    <>
                        {renderMenuItem('Quản lý danh sách đại lý', 'people-circle-outline')}
                        {renderMenuItem('Thống kê hoa hồng', 'pie-chart-outline')}
                        {renderMenuItem('Quản lý Team', 'briefcase-outline')}
                        {renderMenuItem('Phê duyệt yêu cầu', 'checkmark-circle-outline')}
                        {renderMenuItem('Cấu hình CRM', 'settings-outline')}
                        {renderMenuItem('Lịch sử hoạt động', 'time-outline')}
                    </>
                ))}

                {renderSection('CÀI ĐẶT THÔNG BÁO', (
                    <>
                        {renderSwitchItem('Khách hàng mới', 'person-add-outline', notifyNewCustomer, setNotifyNewCustomer)}
                        {renderSwitchItem('Khách hàng đầu tư', 'cash-outline', notifyInvestment, setNotifyInvestment)}
                    </>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    sectionContainer: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#718096',
        marginLeft: 15,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    sectionContent: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F7FAFC',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: '#2D3748',
        marginLeft: 15,
    },
    footer: {
        marginTop: 30,
        marginBottom: 40,
        alignItems: 'center',
    },
    versionText: {
        color: '#A0AEC0',
        fontSize: 13,
    }
});