import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import Header from '../../components/Header';
import { openDrawer } from '../../helpers/navigationRef';
import { getPermissions } from '../../helpers/permissions';
import workplaceApi from '../../api/workplaceApi';

dayjs.locale('vi');

// ── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = (fullName, sex) => {
    const h = new Date().getHours();
    const time    = h < 12 ? 'buổi sáng' : h < 18 ? 'buổi chiều' : 'buổi tối';
    const pronoun = sex === 1 ? 'anh' : sex === 2 ? 'chị' : 'bạn';
    const name    = fullName?.trim().split(/\s+/).pop() ?? '';
    return `Chào ${time}, ${pronoun} ${name}!`;
};

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

const MIME_EXT = {
    'application/pdf': 'PDF',
    'image/png': 'PNG',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-excel': 'XLS',
};
const getExt = (mime) => MIME_EXT[mime] ?? mime?.split('/')[1]?.toUpperCase() ?? 'FILE';

const EXT_COLOR = {
    PDF: '#E53935', PNG: '#1E88E5', JPG: '#1E88E5', JPEG: '#1E88E5',
    DOCX: '#1565C0', DOC: '#1565C0', XLSX: '#2E7D32', XLS: '#2E7D32',
};

// ── Sub-components ────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon, color }) => (
    <View style={styles.kpiCard}>
        <View style={[styles.kpiIconBox, { backgroundColor: `${color}18` }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiTitle}>{title}</Text>
    </View>
);

const StatusBadge = ({ status }) => (
    <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[status] ?? '#9CA3AF'}22` }]}>
        <Text style={[styles.badgeText, { color: STATUS_COLOR[status] ?? '#9CA3AF' }]}>
            {STATUS_LABEL[status] ?? 'Không rõ'}
        </Text>
    </View>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WorkplaceDashboardScreen() {
    const navigation = useNavigation();
    const user = useSelector((state) => state.auth.user);
    const accessToken = useSelector((state) => state.auth.accessToken);
    const perms = getPermissions(user);

    const [depts, setDepts] = useState([]);
    const [report, setReport] = useState(null);
    const [files, setFiles] = useState([]);
    const [history, setHistory] = useState([]);
    const [adminReports, setAdminReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = useCallback(async () => {
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

            const deptId = fetchedReport?.department?._id ?? fetchedDepts[0]?._id;
            if (deptId) {
                const [filesRes, historyRes] = await Promise.all([
                    workplaceApi.getDeptFiles(deptId),
                    workplaceApi.getReportHistory(deptId, { page: 1, limit: 8 }),
                ]);
                setFiles(filesRes.data?.data ?? []);
                setHistory(historyRes.data?.data ?? []);
            }

            if (perms.showWeeklyReportAll) {
                const adminRes = await workplaceApi.getAdminReports();
                setAdminReports(adminRes.data?.data ?? []);
            }
        } catch (err) {
            console.log('WorkplaceDashboard fetch error:', err?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [perms.showWeeklyReportAll]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const onRefresh = () => { setRefreshing(true); fetchAll(); };

    const onTimeCount = history.filter(
        (r) => r.status === 'submitted' || r.status === 'late',
    ).length;

    const recentFiles = [...files]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const kpis = [
        { id: 'depts', title: 'Phòng ban truy cập', value: String(depts.length), icon: 'folder-open-outline', color: '#3B82F6' },
        { id: 'files', title: 'File trong phòng ban', value: String(files.length), icon: 'documents-outline', color: '#22C55E' },
        { id: 'report', title: 'Báo cáo tuần này', value: STATUS_LABEL[report?.status] ?? '—', icon: 'calendar-outline', color: '#F59E0B' },
        { id: 'ontime', title: 'Tuần nộp đúng hạn', value: `${onTimeCount}/${history.length}`, icon: 'checkmark-circle-outline', color: '#8B5CF6' },
    ];

    if (loading) {
        return (
            <View style={styles.safeArea}>
                <Header title="Workplace" leftIconName="menu" onLeftPress={() => openDrawer()} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.safeArea}>
            <Header
                title="Workplace"
                leftIconName="menu"
                onLeftPress={() => openDrawer()}
                rightIconName="notifications-outline"
                onRightPress={() => Alert.alert('Thông báo')}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.scroll}
            >
                {/* ── Greeting ── */}
                <View style={styles.greetingBox}>
                    <Text style={styles.greetingTitle}>{getGreeting(user?.full_name, user?.sex)}</Text>
                    <Text style={styles.greetingDate}>
                        {dayjs().format('dddd, DD/MM/YYYY').replace(/^\w/, (c) => c.toUpperCase())} · Workplace
                    </Text>
                </View>

                {/* ── KPI cards ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
                    {kpis.map((k) => <KpiCard key={k.id} {...k} />)}
                </ScrollView>

                {/* ── Báo cáo tuần hiện tại ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Báo cáo họp giao ban tuần</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('WeeklyReportScreen')}>
                            <Text style={styles.sectionLink}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        {report ? (
                            <>
                                <View style={styles.reportRow}>
                                    <Text style={styles.reportDept} numberOfLines={1}>
                                        {report.department?.department_name ?? 'Phòng ban của tôi'}
                                    </Text>
                                    <StatusBadge status={report.status} />
                                </View>
                                {report.deadline && (
                                    <Text style={styles.reportMeta}>
                                        Hạn: {dayjs(report.deadline).format('HH:mm DD/MM/YYYY')}
                                    </Text>
                                )}
                                {report.submittedAt && (
                                    <Text style={[styles.reportMeta, { color: '#22C55E' }]}>
                                        Đã nộp lúc: {dayjs(report.submittedAt).format('HH:mm DD/MM')}
                                    </Text>
                                )}
                                {report.submittedBy && (
                                    <Text style={styles.reportMeta}>
                                        Người nộp: {report.submittedBy.full_name ?? report.submittedBy.username}
                                    </Text>
                                )}
                            </>
                        ) : (
                            <View style={styles.emptyReport}>
                                <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.emptyText}>Chưa có báo cáo tuần này</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={() => navigation.navigate('WeeklyReportScreen')}
                        >
                            <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                            <Text style={styles.submitBtnText}>
                                {report?.status === 'submitted' || report?.status === 'late'
                                    ? 'Nộp lại báo cáo'
                                    : 'Nộp báo cáo'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── File gần đây ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>File gần đây</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('InternalFilesScreen')}>
                            <Text style={styles.sectionLink}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.card}>
                        {recentFiles.length === 0 ? (
                            <View style={styles.emptyReport}>
                                <Ionicons name="folder-open-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.emptyText}>Chưa có file nào</Text>
                            </View>
                        ) : (
                            recentFiles.map((file, idx) => {
                                const ext = getExt(file.mimeType);
                                const extColor = EXT_COLOR[ext] ?? '#6B7280';
                                return (
                                    <TouchableOpacity
                                        key={file._id}
                                        style={[styles.fileRow, idx > 0 && styles.fileRowBorder]}
                                        onPress={() => navigation.navigate('InternalFilesScreen')}
                                    >
                                        <View style={[styles.extBadge, { backgroundColor: `${extColor}18` }]}>
                                            <Text style={[styles.extText, { color: extColor }]}>{ext}</Text>
                                        </View>
                                        <View style={styles.fileInfo}>
                                            <Text style={styles.fileName} numberOfLines={1}>
                                                {file.originalName}
                                            </Text>
                                            <Text style={styles.fileMeta}>
                                                {file.uploadedBy?.full_name ?? file.uploadedBy?.username ?? '—'} · {dayjs(file.createdAt).format('DD/MM/YYYY')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </View>

                {/* ── Admin: Tổng hợp phòng ban ── */}
                {perms.showWeeklyReportAll && adminReports.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Tổng hợp tuần này</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('WeeklyReportScreen')}>
                                <Text style={styles.sectionLink}>Chi tiết</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.card}>
                            {adminReports.slice(0, 6).map((r, idx) => (
                                <View key={idx} style={[styles.adminRow, idx > 0 && styles.fileRowBorder]}>
                                    <Text style={styles.adminDept} numberOfLines={1}>
                                        {r.department?.department_name ?? '—'}
                                    </Text>
                                    <StatusBadge status={r.status} />
                                </View>
                            ))}
                            {adminReports.length > 6 && (
                                <TouchableOpacity
                                    style={{ alignItems: 'center', paddingTop: 8 }}
                                    onPress={() => navigation.navigate('WeeklyReportScreen')}
                                >
                                    <Text style={styles.sectionLink}>
                                        Xem tất cả {adminReports.length} phòng ban
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 16, paddingBottom: 16 },

    greetingBox: { paddingVertical: 16 },
    greetingTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    greetingDate: { fontSize: 13, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },

    kpiScroll: { marginBottom: 4 },
    kpiCard: {
        width: 140,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginRight: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    kpiIconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    kpiValue: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
    kpiTitle: { fontSize: 11, color: '#6B7280', lineHeight: 16 },

    section: { marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    sectionLink: { fontSize: 13, color: '#3B82F6', fontWeight: '500' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    reportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    reportDept: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
    reportMeta: { fontSize: 12, color: '#6B7280', marginBottom: 4 },

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

    emptyReport: { alignItems: 'center', paddingVertical: 20, gap: 8 },
    emptyText: { color: '#9CA3AF', fontSize: 14 },

    fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
    fileRowBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    extBadge: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    extText: { fontSize: 10, fontWeight: '700' },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 13, fontWeight: '600', color: '#111827' },
    fileMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    adminRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    adminDept: { fontSize: 13, color: '#374151', flex: 1, marginRight: 8 },

    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 11, fontWeight: '600' },
});
