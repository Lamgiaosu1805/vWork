import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import Header from '../../components/Header'
import { openDrawer } from '../../helpers/navigationRef'
import { useSelector, useDispatch } from 'react-redux'
import { Ionicons } from '@expo/vector-icons';
import utils from '../../helpers/utils'
import { useCustomAlert } from '../../components/CustomAlertProvider'
import api from '../../api/axiosInstance'
import { setCredentials } from '../../redux/slice/authSlice'
import { Bell, Menu } from 'lucide-react-native'
import useTheme from '../../assets/theme/useTheme'
import { COLORS } from '../../assets/theme/colors'

const InfoItem = ({ icon, label, value }) => (
    <View style={styles.infoItem}>
        <View style={styles.infoIconCircle}>
            <Ionicons name={icon} size={20} color={COLORS.Primary} />
        </View>
        <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                {value || 'Chưa có'}
            </Text>
        </View>
    </View>
);

const ActionRow = ({ icon, label, onPress, isLast }) => (
    <TouchableOpacity
        style={[styles.actionRow, isLast && { borderBottomWidth: 0 }]}
        activeOpacity={0.7}
        onPress={onPress}
    >
        <View style={styles.actionLeft}>
            <Ionicons name={icon} size={22} color={COLORS.Primary} />
            <Text style={styles.actionLabel} numberOfLines={1} ellipsizeMode="tail">
                {label}
            </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={COLORS.neutral.neutral400} />
    </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
    const { colors } = useTheme();
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
        setAvatarBase64(user?.avatar);
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

    const positionLine = (user?.departments || [])
        .map(item => `${item?.position?.position_name} - ${item?.department?.department_name}`)
        .join(', ');

    return (
        <View style={[styles.container, { backgroundColor: colors.main }]}>
            <Header
                title="Hồ sơ cá nhân"
                LeftIcon={Menu}
                onLeftPress={() => openDrawer()}
                RightIcon={Bell}
                onRightPress={() => navigation.navigate('Notification')}
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
                        colors={[COLORS.Primary]}        // Android
                        tintColor={COLORS.Primary}          // iOS
                        title="Đang cập nhật..."    // iOS
                        titleColor={COLORS.Primary}         // iOS
                    />
                }
            >
                <View style={[styles.block, styles.headerBlock]}>
                    {avatarLoading ? (
                        <View style={styles.avatarPlaceholder}>
                            <ActivityIndicator color={COLORS.Primary} />
                        </View>
                    ) : avatarBase64 ? (
                        <Image source={{ uri: avatarBase64 }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={32} color={COLORS.neutral.neutral400} />
                        </View>
                    )}

                    <View style={styles.headerInfo}>
                        <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">
                            {user?.full_name}
                        </Text>
                        {!!positionLine && (
                            <Text style={styles.subText} numberOfLines={2} ellipsizeMode="tail">
                                {positionLine}
                            </Text>
                        )}
                        <Text style={styles.subText} numberOfLines={1} ellipsizeMode="tail">
                            Mã NV: {user?.ma_nv}
                        </Text>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Đang làm việc</Text>
                        </View>
                    </View>
                </View>

                <View style={{ marginTop: 24 }}>
                    <Text style={styles.sectionTitle}>Thông tin nhân sự</Text>
                    <View style={[styles.block, { marginTop: 12 }]}>
                        <InfoItem icon="mail-outline" label="Email" value={user?.email} />
                        <InfoItem icon="call-outline" label="Số điện thoại" value={user?.phone_number} />
                        <InfoItem icon="card-outline" label="Số CC/CCCD/CMND" value={user?.cccd} />
                        <InfoItem icon="calendar-outline" label="Ngày sinh" value={utils.formatDate(user?.date_of_birth)} />
                        <InfoItem icon="school-outline" label="Trình độ" value="Đại học" />
                        <InfoItem
                            icon="male-female-outline"
                            label="Giới tính"
                            value={user?.sex === 0 ? 'Nữ' : user?.sex === 1 ? 'Nam' : null}
                        />
                        <View style={[styles.infoItem, { marginBottom: 0 }]}>
                            <View style={styles.infoIconCircle}>
                                <Ionicons name="star-outline" size={20} color={COLORS.Primary} />
                            </View>
                            <View style={styles.infoTextWrap}>
                                <Text style={styles.infoLabel}>Tình trạng hôn nhân</Text>
                                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                                    {utils.renderMaritalStatus(user?.tinh_trang_hon_nhan) || 'Chưa có'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ marginTop: 24 }}>
                    <Text style={styles.sectionTitle}>Giấy tờ &amp; lịch sử</Text>
                    <View style={[styles.block, { marginTop: 12, paddingVertical: 4, paddingHorizontal: 16 }]}>
                        <ActionRow
                            icon="document-outline"
                            label="Tài liệu hồ sơ"
                            onPress={() => navigation.navigate('DocumentInfoScreen')}
                        />
                        <ActionRow
                            icon="document-text-outline"
                            label="Hợp đồng lao động"
                            onPress={() => (user?.laborContracts && user?.laborContracts?.length > 0)
                                ? navigation.navigate('ShowFileScreen')
                                : showAlert("Thông báo", "Hợp đồng của bạn chưa được tải lên !")
                            }
                        />
                        <ActionRow
                            icon="timer-outline"
                            label="Lịch sử làm việc"
                            onPress={() => { }}
                            isLast
                        />
                    </View>
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
        backgroundColor: COLORS.white,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    headerBlock: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    headerInfo: {
        flex: 1,
        minWidth: 0,
        marginLeft: 14,
    },
    nameText: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.neutral.neutral900,
    },
    subText: {
        fontSize: 13,
        marginTop: 6,
        color: COLORS.text.bland,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: COLORS.success.success50,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.success.success500,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.success.success700,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.neutral.neutral900,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${COLORS.Primary}1A`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextWrap: {
        flex: 1,
        minWidth: 0,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.text.bland,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.neutral.neutral800,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: COLORS.neutral.neutral100,
        paddingVertical: 14,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
        marginRight: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.neutral.neutral800,
        marginLeft: 14,
        flexShrink: 1,
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
        backgroundColor: COLORS.neutral.neutral100,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
