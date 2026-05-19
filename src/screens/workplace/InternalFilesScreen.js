import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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
        <Ionicons name="folder-outline" size={14} color={selected ? '#fff' : '#6B7280'} />
        <Text style={[styles.deptChipText, selected && styles.deptChipTextActive]} numberOfLines={1}>
            {dept.department_name}
        </Text>
    </TouchableOpacity>
);

const FolderItem = ({ folder, onOpen, onDelete, canDelete }) => (
    <TouchableOpacity style={styles.folderCard} onPress={() => onOpen(folder)} activeOpacity={0.7}>
        <View style={styles.folderIcon}>
            <Ionicons name="folder" size={28} color="#3B82F6" />
        </View>
        <View style={styles.folderInfo}>
            <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
            <Text style={styles.folderMeta}>
                {folder.createdBy?.full_name ?? folder.createdBy?.username ?? '—'}
            </Text>
        </View>
        {canDelete && (
            <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onDelete(folder)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
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

// ── Create folder modal ───────────────────────────────────────────────────────
const CreateFolderModal = ({ visible, onClose, onCreate, creating }) => {
    const [name, setName] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (visible) setTimeout(() => inputRef.current?.focus(), 100);
        else setName('');
    }, [visible]);

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate(name.trim());
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalOverlay}
            >
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Tạo thư mục mới</Text>
                    <TextInput
                        ref={inputRef}
                        style={styles.modalInput}
                        placeholder="Tên thư mục..."
                        value={name}
                        onChangeText={setName}
                        onSubmitEditing={handleCreate}
                        returnKeyType="done"
                    />
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} disabled={creating}>
                            <Text style={styles.modalCancelText}>Huỷ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalCreateBtn, (!name.trim() || creating) && styles.modalCreateBtnDisabled]}
                            onPress={handleCreate}
                            disabled={!name.trim() || creating}
                        >
                            {creating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.modalCreateText}>Tạo</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InternalFilesScreen() {
    const navigation = useNavigation();
    const user = useSelector((state) => state.auth.user);
    const accessToken = useSelector((state) => state.auth.accessToken);
    const perms = getPermissions(user);
    const currentUserId = user?._id ?? user?.user_id;

    const [depts, setDepts] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [folderStack, setFolderStack] = useState([]); // [{ _id, name }, ...]
    const currentFolderId = folderStack[folderStack.length - 1]?._id ?? null;

    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingContent, setLoadingContent] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [createFolderVisible, setCreateFolderVisible] = useState(false);

    // Hardware back button — naviga su un livello se siamo in una sottocartella
    useEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (folderStack.length > 0) {
                setFolderStack((prev) => prev.slice(0, -1));
                return true;
            }
            return false;
        });
        return () => handler.remove();
    }, [folderStack]);

    const fetchDepts = useCallback(async () => {
        try {
            const res = await workplaceApi.getAccessibleDepts();
            const list = res.data?.data ?? [];
            setDepts(list);
            if (list.length > 0 && !selectedDept) setSelectedDept(list[0]);
        } catch (err) {
            console.log('fetchDepts error:', err?.message);
        } finally {
            setLoadingDepts(false);
            setRefreshing(false);
        }
    }, []);

    const fetchContent = useCallback(async (dept, folderId) => {
        if (!dept?._id) return;
        setLoadingContent(true);
        try {
            const [foldersRes, filesRes] = await Promise.all([
                workplaceApi.getDeptFolders(dept._id, folderId),
                workplaceApi.getDeptFiles(dept._id, folderId),
            ]);
            setFolders(foldersRes.data?.data ?? []);
            setFiles(filesRes.data?.data ?? []);
        } catch (err) {
            console.log('fetchContent error:', err?.message);
            setFolders([]);
            setFiles([]);
        } finally {
            setLoadingContent(false);
        }
    }, []);

    useEffect(() => { fetchDepts(); }, [fetchDepts]);

    useEffect(() => {
        if (selectedDept) fetchContent(selectedDept, currentFolderId);
    }, [selectedDept, currentFolderId, fetchContent]);

    const onRefresh = () => { setRefreshing(true); fetchDepts(); };

    const handleSelectDept = (dept) => {
        setSelectedDept(dept);
        setFolderStack([]);
        setFiles([]);
        setFolders([]);
    };

    const handleOpenFolder = (folder) => {
        setFolderStack((prev) => [...prev, { _id: folder._id, name: folder.name }]);
    };

    const handleGoBack = () => {
        if (folderStack.length > 0) setFolderStack((prev) => prev.slice(0, -1));
    };

    const handleViewFile = (file) => {
        navigation.navigate('WorkplaceFileViewerScreen', { file, authToken: accessToken });
    };

    // ── Upload ────────────────────────────────────────────────────────────────
    const pickFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Cần quyền truy cập thư viện ảnh' });
            return [];
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            copyToCacheDirectory: true,
        });
        if (result.canceled) return [];
        return result.assets.map((a) => ({
            uri: a.uri,
            name: a.fileName ?? a.uri.split('/').pop(),
            type: a.mimeType ?? 'application/octet-stream',
        }));
    };

    const pickFromFiles = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            multiple: true,
        });
        if (result.canceled) return [];
        return result.assets.map((a) => ({
            uri: a.uri,
            name: a.name,
            type: a.mimeType ?? 'application/octet-stream',
        }));
    };

    const handleUpload = async () => {
        if (!selectedDept?._id) return;

        const picked = await new Promise((resolve) => {
            Alert.alert('Chọn nguồn tệp', null, [
                { text: 'Thư viện ảnh', onPress: () => pickFromLibrary().then(resolve) },
                { text: 'Tệp', onPress: () => pickFromFiles().then(resolve) },
                { text: 'Huỷ', style: 'cancel', onPress: () => resolve([]) },
            ]);
        });
        if (!picked.length) return;

        const formData = new FormData();
        picked.forEach((f) => formData.append('files', { uri: f.uri, name: f.name, type: f.type }));
        if (currentFolderId) formData.append('folder_id', currentFolderId);

        setUploading(true);
        try {
            await workplaceApi.uploadDeptFile(selectedDept._id, formData);
            Toast.show({ type: 'success', text1: `Tải lên thành công ${picked.length} file` });
            fetchContent(selectedDept, currentFolderId);
        } catch {
            Toast.show({ type: 'error', text1: 'Tải lên thất bại' });
        } finally {
            setUploading(false);
        }
    };

    // ── Create folder ─────────────────────────────────────────────────────────
    const handleCreateFolder = async (name) => {
        setCreatingFolder(true);
        try {
            await workplaceApi.createFolder(selectedDept._id, name, currentFolderId);
            Toast.show({ type: 'success', text1: `Đã tạo thư mục "${name}"` });
            setCreateFolderVisible(false);
            fetchContent(selectedDept, currentFolderId);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Tạo thư mục thất bại';
            Toast.show({ type: 'error', text1: msg });
        } finally {
            setCreatingFolder(false);
        }
    };

    // ── Delete file ───────────────────────────────────────────────────────────
    const handleDeleteFile = (file) => {
        Alert.alert('Xác nhận xóa', `Xóa file "${file.originalName}"?`, [
            { text: 'Huỷ', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive',
                onPress: async () => {
                    try {
                        await workplaceApi.deleteFile(file._id);
                        Toast.show({ type: 'success', text1: 'Đã xóa file' });
                        fetchContent(selectedDept, currentFolderId);
                    } catch {
                        Toast.show({ type: 'error', text1: 'Xóa thất bại' });
                    }
                },
            },
        ]);
    };

    // ── Delete folder ─────────────────────────────────────────────────────────
    const handleDeleteFolder = (folder) => {
        Alert.alert(
            'Xóa thư mục',
            `Xóa "${folder.name}" và toàn bộ nội dung bên trong?`,
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Xóa', style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await workplaceApi.deleteFolder(selectedDept._id, folder._id);
                            const { deleted_files } = res.data?.data ?? {};
                            Toast.show({ type: 'success', text1: `Đã xóa thư mục${deleted_files ? ` (${deleted_files} file)` : ''}` });
                            // Nếu đang ở trong folder vừa bị xóa thì về cha
                            setFolderStack((prev) => {
                                const idx = prev.findIndex((p) => p._id === folder._id);
                                return idx >= 0 ? prev.slice(0, idx) : prev;
                            });
                            fetchContent(selectedDept, currentFolderId);
                        } catch {
                            Toast.show({ type: 'error', text1: 'Xóa thư mục thất bại' });
                        }
                    },
                },
            ]
        );
    };

    // ── Render items (folders + files mixed) ──────────────────────────────────
    const listItems = [
        ...folders.map((f) => ({ type: 'folder', data: f, key: `folder-${f._id}` })),
        ...files.map((f) => ({ type: 'file', data: f, key: `file-${f._id}` })),
    ];

    const renderItem = ({ item }) => {
        if (item.type === 'folder') {
            return (
                <FolderItem
                    folder={item.data}
                    onOpen={handleOpenFolder}
                    onDelete={handleDeleteFolder}
                    canDelete={perms.showFilesMgmt || item.data.createdBy?._id === currentUserId}
                />
            );
        }
        return (
            <FileItem
                file={item.data}
                onView={handleViewFile}
                onDelete={handleDeleteFile}
                isAdmin={perms.showFilesMgmt}
                currentUserId={currentUserId}
            />
        );
    };

    // ── Breadcrumb ────────────────────────────────────────────────────────────
    const BreadcrumbBar = () => (
        <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={() => setFolderStack([])} style={styles.breadcrumbItem}>
                <Ionicons name="folder-open-outline" size={13} color="#6B7280" />
                <Text style={styles.breadcrumbText}>Root</Text>
            </TouchableOpacity>
            {folderStack.map((f, i) => (
                <React.Fragment key={f._id}>
                    <Text style={styles.breadcrumbSep}>›</Text>
                    <TouchableOpacity
                        onPress={() => setFolderStack((prev) => prev.slice(0, i + 1))}
                        style={styles.breadcrumbItem}
                    >
                        <Text style={[styles.breadcrumbText, i === folderStack.length - 1 && styles.breadcrumbCurrent]} numberOfLines={1}>
                            {f.name}
                        </Text>
                    </TouchableOpacity>
                </React.Fragment>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <Header
                title="Ổ File Nội Bộ"
                leftIconName={folderStack.length > 0 ? 'arrow-back' : 'menu'}
                onLeftPress={folderStack.length > 0 ? handleGoBack : () => openDrawer()}
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
                    {/* Dept selector */}
                    <View style={styles.deptBar}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.deptScroll}
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

                    {/* Breadcrumb */}
                    <BreadcrumbBar />

                    {/* Content list */}
                    {loadingContent ? (
                        <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>
                    ) : (
                        <FlatList
                            data={listItems}
                            keyExtractor={(item) => item.key}
                            renderItem={renderItem}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                            ListHeaderComponent={
                                selectedDept ? (
                                    <View style={styles.listHeader}>
                                        <View>
                                            <Text style={styles.deptHeaderName}>{selectedDept.department_name}</Text>
                                            <Text style={styles.deptHeaderCount}>
                                                {folders.length > 0 ? `${folders.length} thư mục · ` : ''}{files.length} file
                                            </Text>
                                        </View>
                                        <View style={styles.headerBtns}>
                                            <TouchableOpacity
                                                style={styles.newFolderBtn}
                                                onPress={() => setCreateFolderVisible(true)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="folder-open-outline" size={14} color="#3B82F6" />
                                                <Text style={styles.newFolderText}>Thư mục</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                                                onPress={handleUpload}
                                                disabled={uploading}
                                                activeOpacity={0.7}
                                            >
                                                {uploading ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
                                                )}
                                                <Text style={styles.uploadBtnText}>
                                                    {uploading ? 'Đang tải...' : 'Tải lên'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null
                            }
                            ListEmptyComponent={
                                <View style={styles.centered}>
                                    <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyText}>Thư mục trống</Text>
                                </View>
                            }
                        />
                    )}
                </>
            )}

            <CreateFolderModal
                visible={createFolderVisible}
                onClose={() => setCreateFolderVisible(false)}
                onCreate={handleCreateFolder}
                creating={creatingFolder}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 12 },
    emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

    deptBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 8 },
    deptScroll: { paddingHorizontal: 16, gap: 8 },
    deptChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, maxWidth: 160 },
    deptChipActive: { backgroundColor: '#3B82F6' },
    deptChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    deptChipTextActive: { color: '#fff' },

    breadcrumb: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexWrap: 'wrap' },
    breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    breadcrumbText: { fontSize: 12, color: '#6B7280' },
    breadcrumbCurrent: { color: '#111827', fontWeight: '600' },
    breadcrumbSep: { fontSize: 12, color: '#9CA3AF', marginHorizontal: 4 },

    list: { paddingHorizontal: 16, paddingBottom: 30, paddingTop: 4 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    deptHeaderName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    deptHeaderCount: { fontSize: 12, color: '#9CA3AF' },
    headerBtns: { flexDirection: 'row', gap: 8 },

    newFolderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
    newFolderText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
    uploadBtnDisabled: { backgroundColor: '#93C5FD' },
    uploadBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },

    folderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    folderIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    folderInfo: { flex: 1 },
    folderName: { fontSize: 13, fontWeight: '600', color: '#111827' },
    folderMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    extBox: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    extText: { fontSize: 10, fontWeight: '700' },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
    fileMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    categoryBadge: { marginTop: 4, backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
    categoryText: { fontSize: 10, color: '#3B82F6', fontWeight: '600' },
    fileActions: { flexDirection: 'row', gap: 4, marginLeft: 8 },
    actionBtn: { padding: 6 },

    // Create folder modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 360 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
    modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'flex-end' },
    modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    modalCancelText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    modalCreateBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, backgroundColor: '#3B82F6', minWidth: 64, alignItems: 'center' },
    modalCreateBtnDisabled: { backgroundColor: '#93C5FD' },
    modalCreateText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
