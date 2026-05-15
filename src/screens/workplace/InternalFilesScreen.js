import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const DeptChip = ({ dept, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.deptChip, selected && styles.deptChipActive]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Ionicons
            name="folder-outline"
            size={14}
            color={selected ? '#fff' : '#6B7280'}
        />
        <Text
            style={[styles.deptChipText, selected && styles.deptChipTextActive]}
            numberOfLines={1}
        >
            {dept.department_name}
        </Text>
    </TouchableOpacity>
);

const FileItem = ({ file, onView, onDelete, isAdmin, currentUserId }) => {
    const ext = getExt(file.mimeType);
    const extColor = EXT_COLOR[ext] ?? '#6B7280';
    const canDelete = isAdmin || file.uploadedBy?._id === currentUserId;

    return (
        <TouchableOpacity style={styles.fileCard} onPress={() => onView(file)} activeOpacity={0.7}>
            <View style={[styles.extBox, { backgroundColor: `${extColor}18` }]}>
                <Text style={[styles.extText, { color: extColor }]}>{ext}</Text>
            </View>
            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>{file.originalName}</Text>
                <Text style={styles.fileMeta}>
                    {file.uploadedBy?.full_name ?? file.uploadedBy?.username ?? '—'} · {dayjs(file.createdAt).format('DD/MM/YYYY')}
                    {file.size ? ` · ${formatSize(file.size)}` : ''}
                </Text>
                {file.category === 'weekly_report' && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>Báo cáo</Text>
                    </View>
                )}
            </View>
            <View style={styles.fileActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => onView(file)}>
                    <Ionicons name="eye-outline" size={18} color="#3B82F6" />
                </TouchableOpacity>
                {canDelete && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(file)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InternalFilesScreen() {
    const navigation = useNavigation();
    const user = useSelector((state) => state.auth.user);
    const accessToken = useSelector((state) => state.auth.accessToken);
    const perms = getPermissions(user);

    const [depts, setDepts] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [files, setFiles] = useState([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Fetch accessible departments
    const fetchDepts = useCallback(async () => {
        try {
            const res = await workplaceApi.getAccessibleDepts();
            const list = res.data?.data ?? [];
            setDepts(list);
            if (list.length > 0 && !selectedDept) {
                setSelectedDept(list[0]);
            }
        } catch (err) {
            console.log('InternalFiles fetchDepts error:', err?.message);
        } finally {
            setLoadingDepts(false);
            setRefreshing(false);
        }
    }, []);

    // Fetch files for selected dept
    const fetchFiles = useCallback(async (dept) => {
        if (!dept?._id) return;
        setLoadingFiles(true);
        try {
            const res = await workplaceApi.getDeptFiles(dept._id);
            setFiles(res.data?.data ?? []);
        } catch (err) {
            console.log('InternalFiles fetchFiles error:', err?.message);
            setFiles([]);
        } finally {
            setLoadingFiles(false);
        }
    }, []);

    useEffect(() => { fetchDepts(); }, [fetchDepts]);
    useEffect(() => { if (selectedDept) fetchFiles(selectedDept); }, [selectedDept, fetchFiles]);

    const onRefresh = () => { setRefreshing(true); fetchDepts(); };

    const handleSelectDept = (dept) => {
        setSelectedDept(dept);
        setFiles([]);
    };

    const handleViewFile = (file) => {
        navigation.navigate('WorkplaceFileViewerScreen', {
            file,
            authToken: accessToken,
        });
    };

    const handleUpload = async () => {
        if (!selectedDept?._id) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Cần quyền truy cập thư viện ảnh' });
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: false,
            copyToCacheDirectory: true,
        });
        if (result.canceled) return;

        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('file', {
            uri: asset.uri,
            name: asset.fileName ?? asset.uri.split('/').pop(),
            type: asset.mimeType ?? 'application/octet-stream',
        });

        setUploading(true);
        try {
            await workplaceApi.uploadDeptFile(selectedDept._id, formData);
            Toast.show({ type: 'success', text1: 'Tải lên thành công' });
            fetchFiles(selectedDept);
        } catch {
            Toast.show({ type: 'error', text1: 'Tải lên thất bại' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteFile = (file) => {
        Alert.alert(
            'Xác nhận xóa',
            `Xóa file "${file.originalName}"?`,
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await workplaceApi.deleteFile(file._id);
                            Toast.show({ type: 'success', text1: 'Đã xóa file' });
                            fetchFiles(selectedDept);
                        } catch {
                            Toast.show({ type: 'error', text1: 'Xóa thất bại' });
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <Header
                title="Ổ File Nội Bộ"
                leftIconName="menu"
                onLeftPress={() => openDrawer()}
            />

            {loadingDepts ? (
                <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>
            ) : depts.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Bạn chưa có phòng ban nào được truy cập</Text>
                </View>
            ) : (
                <>
                    {/* ── Dept selector ── */}
                    <View style={styles.deptBar}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.deptScroll}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                        >
                            {depts.map((dept) => (
                                <DeptChip
                                    key={dept._id}
                                    dept={dept}
                                    selected={selectedDept?._id === dept._id}
                                    onPress={() => handleSelectDept(dept)}
                                />
                            ))}
                        </ScrollView>
                    </View>

                    {/* ── File list ── */}
                    {loadingFiles ? (
                        <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>
                    ) : (
                        <FlatList
                            data={files}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <FileItem
                                    file={item}
                                    onView={handleViewFile}
                                    onDelete={handleDeleteFile}
                                    isAdmin={perms.showFilesMgmt}
                                    currentUserId={user?._id ?? user?.user_id}
                                />
                            )}
                            contentContainerStyle={styles.fileList}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                            ListEmptyComponent={
                                <View style={styles.centered}>
                                    <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyText}>
                                        {selectedDept
                                            ? `Chưa có file nào trong "${selectedDept.department_name}"`
                                            : 'Chọn phòng ban để xem file'}
                                    </Text>
                                </View>
                            }
                            ListHeaderComponent={
                                selectedDept ? (
                                    <View style={styles.deptHeader}>
                                        <View>
                                            <Text style={styles.deptHeaderName}>{selectedDept.department_name}</Text>
                                            <Text style={styles.deptHeaderCount}>{files.length} file</Text>
                                        </View>
                                        {perms.showFilesMgmt && (
                                            <TouchableOpacity
                                                style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                                                onPress={handleUpload}
                                                disabled={uploading}
                                                activeOpacity={0.7}
                                            >
                                                {uploading ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                                                )}
                                                <Text style={styles.uploadBtnText}>
                                                    {uploading ? 'Đang tải...' : 'Tải lên'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : null
                            }
                        />
                    )}
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 12 },
    emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

    deptBar: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 8,
    },
    deptScroll: { paddingHorizontal: 16, gap: 8 },
    deptChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        maxWidth: 160,
    },
    deptChipActive: { backgroundColor: '#3B82F6' },
    deptChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    deptChipTextActive: { color: '#fff' },

    deptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    deptHeaderName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    deptHeaderCount: { fontSize: 12, color: '#9CA3AF' },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    uploadBtnDisabled: { backgroundColor: '#93C5FD' },
    uploadBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },

    fileList: { paddingHorizontal: 16, paddingBottom: 30, paddingTop: 4 },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    extBox: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    extText: { fontSize: 10, fontWeight: '700' },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
    fileMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    categoryBadge: { marginTop: 4, backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
    categoryText: { fontSize: 10, color: '#3B82F6', fontWeight: '600' },
    fileActions: { flexDirection: 'row', gap: 4, marginLeft: 8 },
    actionBtn: { padding: 6 },
});
