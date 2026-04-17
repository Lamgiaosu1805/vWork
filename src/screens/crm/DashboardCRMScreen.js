import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, SafeAreaView } from 'react-native'
import React, { useEffect, useState } from 'react'
import QRCode from "react-native-qrcode-svg"
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { openDrawer } from '../../helpers/navigationRef'
import api from '../../api/axiosInstance'

const { width } = Dimensions.get('window');

export default function DashboardCRMScreen() {
    const [dataQR, setDataQR] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/user/getQRSale', { requiresAuth: true });
                setDataQR(res.data);
            } catch (error) {
                console.log("Error fetching Dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0055ba" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header - Đưa ra ngoài ScrollView để cố định */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => openDrawer()}>
                    <Icon name="menu" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CRM Dashboard</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Welcome Section */}
                <View style={styles.welcomeBox}>
                    <Text style={styles.welcomeText}>Xin chào,</Text>
                    <Text style={styles.saleName}>{dataQR?.sale_name || "Nhân viên Sales"}</Text>
                    <Text style={styles.saleId}>Mã nhân viên: {dataQR?.ma_nv}</Text>
                </View>

                {/* QR Section - Trọng tâm */}
                <View style={styles.qrCard}>
                    <Text style={styles.qrTitle}>Mã QR Giới Thiệu</Text>
                    <Text style={styles.qrSubTitle}>Khách hàng quét mã để mở tài khoản</Text>

                    <View style={styles.qrWrapper}>
                        {dataQR?.link ? (
                            <QRCode
                                value={dataQR.link}
                                size={width * 0.6}
                                logoBackgroundColor='transparent'
                                color="#000"
                                backgroundColor="#fff"
                            />
                        ) : null}
                    </View>

                    <TouchableOpacity style={styles.shareBtn}>
                        <Icon name="share-variant" size={20} color="#0055ba" />
                        <Text style={styles.shareBtnText}>Chia sẻ liên kết</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statBox, { backgroundColor: '#e3f2fd' }]}>
                        <Icon name="account-group" size={24} color="#1976d2" />
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Khách hàng</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#f3e5f5' }]}>
                        <Icon name="currency-usd" size={24} color="#7b1fa2" />
                        <Text style={styles.statNumber}>5</Text>
                        <Text style={styles.statLabel}>Hợp đồng</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        backgroundColor: '#0055ba',
        height: 100,
        paddingTop: 45, // Tăng nhẹ để tránh tai thỏ iPhone
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10, // Đảm bảo header luôn nằm trên các thành phần khác
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    welcomeBox: {
        padding: 20,
        backgroundColor: '#0055ba',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 50,
    },
    welcomeText: {
        color: '#e0e0e0',
        fontSize: 16,
    },
    saleName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 5,
    },
    saleId: {
        color: '#bbdefb',
        fontSize: 14,
        marginTop: 5,
    },
    qrCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        marginTop: -30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    qrTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    qrSubTitle: {
        fontSize: 13,
        color: '#777',
        marginTop: 5,
        marginBottom: 20,
    },
    qrWrapper: {
        padding: 15,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 15,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#0055ba',
    },
    shareBtnText: {
        color: '#0055ba',
        fontWeight: '600',
        marginLeft: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 20,
        justifyContent: 'space-between',
    },
    statBox: {
        width: '47%',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    }
})