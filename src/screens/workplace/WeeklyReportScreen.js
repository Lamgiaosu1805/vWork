import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import Header from '../../components/Header';
import { openDrawer } from '../../helpers/navigationRef';
import { getPermissions } from '../../helpers/permissions';
import workplaceApi from '../../api/workplaceApi';

dayjs.locale('vi');

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_LABEL = {
    submitted: 'Đã nộp',
    late: 'Nộp trễ',
    missing: 'Thiếu báo cáo',
    pending: 'Chưa nộp',
};
const STATUS_COLOR = {
    submitted: '#22C55E',
    late: '#F59E0B',
    missing: '#EF4444',
    pending: '#9CA3AF',
};

// ── Sub-components ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
    <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[status] ?? '#9CA3AF'}22` }]}>
        <Text style={[styles.badgeText, { color: STATUS_COLOR[status] ?? '#9CA3AF' }]}>
            {STATUS_LABEL[status] ?? 'Không rõ'}
        </Text>
    </View>
);

const SectionTab = ({ tabs, active, onChange }) => (
    <View style={styles.tabBar}>
        {tabs.map((t, i) => (
            <TouchableOpacity
                key={i}
                style={[styles.tab, active === i && styles.tabActive]}
                onPress={() => onChange(i)}
            >
                <Text style={[styles.tabText, active === i && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
        ))}
    </View>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WeeklyReportScreen() {
    const user = useSelector((state) => state.auth.user);
    const perms = getPermissions(user);

    const [depts, setDepts] = useState([]);
    const [report, setReport] = useState(null);
    const [history, setHistory] = useState([]);
    const [adminReports, setAdminReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState(0);

    // Submit modal state
    const [submitOpen, setSubmitOpen] = useState(false);
    const [note, setNote] = useState('');
    const [pickedFile, setPickedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const deptId = report?.department?._id ?? depts[0]?._id;

    const fetchData = useCallback(async () => {
        try {
            const [deptsRes, reportRes] = await Promise.all([
                workplaceApi.getAccessibleDepts(),
                workplaceApi.getMyDeptReport(),
            ]);

            const fetchedDepts = deptsRes.data?.data ?? [];
            const reports = reportRes.data?.data ?? [];
            const fetchedReport = reports[0] ?? null;
            setDepts(fetchedDepts);
            setReport(fetchedReport);

            const id = fetchedReport?.department?._id ?? fetchedDepts[0]?._id;
            if (id) {
                const historyRes = await workplaceApi.getReportHistory(id, { page: 1, limit: 20 });
                setHistory(historyRes.data?.data ?? []);
            }

            if (perms.showWeeklyReportAll) {
                const adminRes = await workplaceApi.getAdminReports();
                setAdminReports(adminRes.data?.data ?? []);
            }
        } catch (err) {
            console.log('WeeklyReport fetch error:', err?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [perms.showWeeklyReportAll]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const handlePickFile = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Cần quyền truy cập thư viện' });
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: false,
            copyToCacheDirectory: true,
        });
        if (!result.canceled) setPickedFile(result.assets[0]);
    };

    const handleSubmit = async () => {
        if (!deptId) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin phòng ban.');
            return;
        }
        if (!pickedFile) {
            Alert.alert('Thiếu file', 'Vui lòng đính kèm file báo cáo trước khi nộp.');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: pickedFile.uri,
                name: pickedFile.fileName ?? pickedFile.uri.split('/').pop(),
                type: pickedFile.mimeType ?? 'application/octet-stream',
            });
            if (note.trim()) formData.append('note', note.trim());

            const res = await workplaceApi.submitReport(deptId, formData);
            const msg = res.data?.message ?? 'Nộp báo cáo thành công';
            Toast.show({
                type: msg.toLowerCase().includes('trễ') ? 'info' : 'success',
                text1: 'Thông báo',
                text2: msg,
            });
            setSubmitOpen(false);
            setNote('');
            setPickedFile(null);
            fetchData();
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: err?.response?.data?.message ?? 'Nộp báo cáo thất bại',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const renderHistoryItem = ({ item, index }) => (
        <View style={[styles.historyRow, index > 0 && styles.divider]}>
            <View style={styles.historyLeft}>
                <Text style={styles.historyWeek}>
                    {item.weekStart ? `Tuần ${dayjs(item.weekStart).format('DD/MM')}` : `Tuần ${index + 1}`}
                </Text>
                {item.submittedAt && (
                    <Text style={styles.historyMeta}>
                        Nộp lúc {dayjs(item.submittedAt).format('HH:mm DD/MM')}
                    </Text>
                )}
                {item.submittedBy && (
                    <Text style={styles.historyMeta}>
                        {item.submittedBy.full_name ?? item.submittedBy.username}
                    </Text>
                )}
            </View>
            <StatusBadge status={item.status} />
        </View>
    );

    const renderAdminItem = ({ item, index }) => (
        <View style={[styles.historyRow, index > 0 && styles.divider]}>
            <Text style={styles.adminDeptName} numberOfLines={1}>
                {item.department?.department_name ?? '—'}
            </Text>
            <View style={styles.adminRight}>
                {item.submittedAt && (
                    <Text style={styles.historyMeta}>{dayjs(item.submittedAt).format('HH:mm DD/MM')}</Text>
                )}
                <StatusBadge status={item.status} />
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['bottom']}>
                <Header title="Báo Cáo Tuần" leftIconName="menu" onLeftPress={() => openDrawer()} />
                <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>
            </SafeAreaView>
        );
    }

    const tabs = perms.showWeeklyReportAll ? ['Lịch sử', 'Tổng hợp'] : ['Lịch sử'];

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <Header
                title="Báo Cáo Tuần"
                leftIconName="menu"
                onLeftPress={() => openDrawer()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.scroll}
            >
                {/* ── Status card tuần này ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>Báo cáo tuần này</Text>
                            <Text style={styles.cardSubtitle}>
                                {report?.department?.department_name ?? depts[0]?.department_name ?? 'Phòng ban của tôi'}
                            </Text>
                        </View>
                        <StatusBadge status={report?.status ?? 'pending'} />
                    </View>

                    {report?.deadline && (
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                            <Text style={styles.infoText}>
                                Hạn nộp: {dayjs(report.deadline).format('HH:mm DD/MM/YYYY')}
                            </Text>
                        </View>
                    )}
                    {report?.weekStart && (
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                            <Text style={styles.infoText}>
                                Tuần bắt đầu: {dayjs(report.weekStart).format('DD/MM/YYYY')}
                            </Text>
                        </View>
                    )}
                    {report?.submittedAt && (
                        <View style={styles.infoRow}>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#22C55E" />
                            <Text style={[styles.infoText, { color: '#22C55E' }]}>
                                Đã nộp lúc: {dayjs(report.submittedAt).format('HH:mm DD/MM/YYYY')}
                            </Text>
                        </View>
                    )}
                    {report?.submittedBy && (
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={14} color="#9CA3AF" />
                            <Text style={styles.infoText}>
                                Người nộp: {report.submittedBy.full_name ?? report.submittedBy.username}
                            </Text>
                        </View>
                    )}
                    {report?.note && (
                        <Text style={styles.noteText}>"{report.note}"</Text>
                    )}

                    <TouchableOpacity style={styles.submitBtn} onPress={() => setSubmitOpen(true)}>
                        <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                        <Text style={styles.submitBtnText}>
                            {report?.status === 'submitted' || report?.status === 'late'
                                ? 'Nộp lại báo cáo'
                                : 'Nộp báo cáo ngay'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ── Tabs: Lịch sử / Tổng hợp ── */}
                <View style={[styles.card, { marginTop: 16, paddingHorizontal: 0, paddingBottom: 0 }]}>
                    <SectionTab tabs={tabs} active={tab} onChange={setTab} />

                    {/* Lịch sử */}
                    {tab === 0 && (
                        history.length === 0 ? (
                            <View style={styles.empty}>
                                <Ionicons name="document-outline" size={36} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Chưa có lịch sử nộp</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={history}
                                keyExtractor={(_, i) => String(i)}
                                renderItem={renderHistoryItem}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14 }}
                            />
                        )
                    )}

                    {/* Tổng hợp (admin) */}
                    {tab === 1 && perms.showWeeklyReportAll && (
                        adminReports.length === 0 ? (
                            <View style={styles.empty}>
                                <Ionicons name="stats-chart-outline" size={36} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Chưa có dữ liệu tổng hợp</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={adminReports}
                                keyExtractor={(_, i) => String(i)}
                                renderItem={renderAdminItem}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14 }}
                            />
                        )
                    )}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* ── Submit modal ── */}
            <Modal visible={submitOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nộp báo cáo họp giao ban tuần</Text>
                            <TouchableOpacity onPress={() => { setSubmitOpen(false); setNote(''); setPickedFile(null); }}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>File đính kèm *</Text>
                        <TouchableOpacity style={styles.filePicker} onPress={handlePickFile} activeOpacity={0.7}>
                            <Ionicons name="attach-outline" size={18} color="#3B82F6" />
                            <Text style={styles.filePickerText} numberOfLines={1}>
                                {pickedFile
                                    ? pickedFile.fileName ?? pickedFile.uri.split('/').pop()
                                    : 'Chọn file báo cáo...'}
                            </Text>
                            {pickedFile && (
                                <TouchableOpacity onPress={() => setPickedFile(null)}>
                                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>Ghi chú</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Nhập nội dung ghi chú..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            value={note}
                            onChangeText={setNote}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Ionicons name="cloud-upload-outline" size={16} color="#fff" />}
                            <Text style={styles.submitBtnText}>
                                {submitting ? 'Đang nộp...' : 'Xác nhận nộp'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    infoText: { fontSize: 12, color: '#6B7280' },
    noteText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6, marginTop: 8 },

    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 10,
        marginTop: 12,
        gap: 6,
    },
    submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    // Tabs
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
    tabText: { fontSize: 13, color: '#6B7280' },
    tabTextActive: { color: '#3B82F6', fontWeight: '600' },

    // History / Admin rows
    historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    divider: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    historyLeft: { flex: 1, marginRight: 8 },
    historyWeek: { fontSize: 13, fontWeight: '600', color: '#111827' },
    historyMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    adminDeptName: { fontSize: 13, color: '#374151', flex: 1, marginRight: 8 },
    adminRight: { alignItems: 'flex-end', gap: 4 },

    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 11, fontWeight: '600' },

    empty: { alignItems: 'center', paddingVertical: 30, gap: 8 },
    emptyText: { color: '#9CA3AF', fontSize: 14 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    noteInput: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
        padding: 10, fontSize: 14, color: '#111827',
        minHeight: 90, marginBottom: 10,
    },
    filePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#F9FAFB',
        marginBottom: 12,
    },
    filePickerText: { flex: 1, fontSize: 13, color: '#374151' },
});
