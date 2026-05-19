import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import Header from '../../components/Header'
import { openDrawer } from '../../helpers/navigationRef'
import { useSelector, useDispatch } from 'react-redux'
import { Ionicons } from '@expo/vector-icons';
import utils from '../../helpers/utils'
import { useCustomAlert } from '../../components/CustomAlertProvider'
import api from '../../api/axiosInstance'
import { setCredentials } from '../../redux/slice/authSlice'

export default function ProfileScreen({ navigation }) {
    const dispatch = useDispatch();
    const { showAlert } = useCustomAlert();

    // Dùng useSelector thay vì store.getState() để tự động re-render khi redux thay đổi
    const user = useSelector(state => state.auth.user);
    const accessToken = useSelector(state => state.auth.accessToken);

    const [avatarBase64, setAvatarBase64] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAvatar();
    }, [user?.avatar]);

    const fetchAvatar = async () => {
        if (!user?.avatar) return;
        try {
            setAvatarLoading(true);
            const res = await api.get(
                `/document/getFile?filename=${user.avatar}`,
                { requiresAuth: true, responseType: "blob" }
            );
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarBase64(reader.result);
                setAvatarLoading(false);
            };
            reader.readAsDataURL(res.data);
        } catch (error) {
            console.log("fetchAvatar error:", error.message);
            setAvatarLoading(false);
        }
    };

    // Gọi lại getUserInfo và cập nhật redux
    const fetchUserInfo = async () => {
        try {
            const res = await api.get("/user/getUserInfo", { requiresAuth: true });
            const updatedUser = res.data;
            dispatch(setCredentials({ user: updatedUser, accessToken }));
        } catch (error) {
            console.log("fetchUserInfo error:", error.response?.data || error.message);
            showAlert("Thông báo", "Không thể cập nhật thông tin, vui lòng thử lại");
        }
    };

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUserInfo();
        setRefreshing(false);
    }, [accessToken]);

    return (
        <View style={styles.container}>
            <Header
                title="Hồ sơ cá nhân"
                leftIconName="menu"
                onLeftPress={() => openDrawer()}
                rightIconName="notifications"
                onRightPress={() => Alert.alert('Notifications Pressed')}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 20,
                    paddingBottom: 30,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#004643"]}        // Android
                        tintColor="#004643"          // iOS
                        title="Đang cập nhật..."    // iOS
                        titleColor="#004643"         // iOS
                    />
                }
            >
                <View style={[styles.block, { flexDirection: 'row' }]}>
                    <View style={styles.info}>
                        {avatarLoading ? (
                            <View style={styles.avatarPlaceholder}>
                                <ActivityIndicator color="#004643" />
                            </View>
                        ) : avatarBase64 ? (
                            <Image source={{ uri: avatarBase64 }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={32} color="#aaa" />
                            </View>
                        )}

                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.titleText}>{user?.full_name}</Text>
                            {user?.departments.map((item, index) => (
                                <Text style={styles.infoText} key={index}>
                                    {item.position.position_name} - {item.department.department_name}
                                </Text>
                            ))}
                            <Text style={styles.infoText}>Mã NV: {user?.ma_nv}</Text>
                            <Text style={styles.infoText}>Hình thức: {user?.employment_type || "chưa có"}</Text>
                            <Text style={styles.infoText}>
                                Trạng thái: <Text style={{ color: "#22C55E", fontWeight: '800' }}>Đang làm việc</Text>
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ marginTop: 32 }}>
                    <Text style={styles.titleText}>Thông tin nhân sự</Text>
                    <View style={[styles.block, { marginTop: 12 }]}>
                        <View style={styles.infoItem}>
                            <Ionicons name="mail-outline" size={24} color="#004643" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 12, color: 'gray', marginBottom: 4 }}>Email</Text>
                                <Text style={{ color: '#004643' }}>chưa có</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="call-outline" size={24} color="#004643" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 12, color: 'gray', marginBottom: 4 }}>Số điện thoại</Text>
                                <Text style={{ color: '#004643' }}>{user?.phone_number}</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="card-outline" size={24} color="#004643" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 12, color: 'gray', marginBottom: 4 }}>Số CC/CCCD/CMND</Text>
                                <Text style={{ color: '#004643' }}>{user?.cccd}</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={24} color="#004643" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 12, color: 'gray', marginBottom: 4 }}>Ngày sinh</Text>
                                <Text style={{ color: '#004643' }}>{utils.formatDate(user?.date_of_birth)}</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="school-outline" size={24} color="#004643" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 12, color: 'gray', marginBottom: 4 }}>Trình Độ</Text>
                                <Text style={{ color: '#004643' }}>Đại học</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="male-female-outline" size={24} color="#004643" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 12, color: 'gray', marginBottom: 4 }}>Giới tính</Text>
                                <Text style={{ color: '#004643' }}>{user?.sex === 0 ? "Nữ" : user?.sex === 1 ? "Nam" : "—"}</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="star-outline" size={24} color="#004643" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 12, color: 'gray', marginBottom: 4 }}>Tình trạng hôn nhân</Text>
                                <Text style={{ color: '#004643' }}>{utils.renderMaritalStatus(user?.tinh_trang_hon_nhan)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={[styles.block, { paddingVertical: 8 }]}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12 }}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('DocumentInfoScreen')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="document-outline" size={24} color="#004643" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#004643', marginLeft: 16 }}>Tài liệu hồ sơ</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={24} color="#004643" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12 }}
                        activeOpacity={0.7}
                        onPress={() => (user?.laborContracts && user?.laborContracts?.length > 0)
                            ? navigation.navigate('ShowFileScreen')
                            : showAlert("Thông báo", "Hợp đồng của bạn chưa được tải lên !")
                        }
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="document-text-outline" size={24} color="#004643" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#004643', marginLeft: 16 }}>Hợp đồng lao động</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={24} color="#004643" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}
                        activeOpacity={0.7}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="timer-outline" size={24} color="#004643" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#004643', marginLeft: 16 }}>Lịch sử làm việc</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={24} color="#004643" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    block: {
        padding: 16,
        backgroundColor: 'white',
        marginTop: 20,
        borderRadius: 8
    },
    info: {
        flexDirection: 'row'
    },
    titleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#004643'
    },
    infoText: {
        fontSize: 14,
        marginTop: 8,
        color: '#004643'
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
});