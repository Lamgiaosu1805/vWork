import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import Header from '../../components/Header';
import api from '../../api/axiosInstance';
import dayjs from 'dayjs';
import { ChevronLeft } from 'lucide-react-native';

const decodeFilename = (name) => {
    if (!name) return '';
    try { return decodeURIComponent(name); } catch { return name; }
};

const formatDate = (val) => {
    const d = dayjs(val);
    return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : val;
};

const COPIES_OPTIONS  = [1, 2, 3, 4, 5];
const PAPER_OPTIONS   = ['A4', 'A3', 'A5', 'Letter'];
const ORIENT_OPTIONS  = [
    { value: 'portrait',  label: 'Dọc' },
    { value: 'landscape', label: 'Ngang' },
];

const Toggle = ({ value, onToggle }) => (
    <TouchableOpacity
        style={[styles.toggle, value && styles.toggleActive]}
        onPress={onToggle}
        activeOpacity={0.8}
    >
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </TouchableOpacity>
);

export default function PrintScreen({ navigation }) {
    const user = useSelector((s) => s.auth.user);

    const [printerStatus, setPrinterStatus] = useState(null);
    const [printerName,   setPrinterName]   = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [copies,        setCopies]        = useState(1);
    const [duplex,        setDuplex]        = useState(false);
    const [paperSize,     setPaperSize]     = useState('A4');
    const [orientation,   setOrientation]   = useState('portrait');
    const [pageRange,     setPageRange]     = useState('');
    const [fitToPage,     setFitToPage]     = useState(false);
    const [printing,      setPrinting]      = useState(false);
    const [stats,         setStats]         = useState(null);
    const [history,       setHistory]       = useState([]);
    const [refreshing,    setRefreshing]    = useState(false);

    const checkStatus = useCallback(async () => {
        setStatusLoading(true);
        try {
            const res = await api.get('/print/status', { requiresAuth: true });
            const d = res.data ?? res;
            setPrinterStatus(d?.ok === true);
            if (d?.printer) setPrinterName(String(d.printer));
        } catch {
            setPrinterStatus(false);
        } finally {
            setStatusLoading(false);
        }
    }, []);

    const loadStatsAndHistory = useCallback(async () => {
        try {
            const [s, h] = await Promise.all([
                api.get('/print/stats',   { requiresAuth: true }),
                api.get('/print/history', { requiresAuth: true, params: { limit: 10 } }),
            ]);
            setStats(s.data ?? s);
            setHistory((h.data?.data ?? h.data) || []);
        } catch { /* silent */ }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([checkStatus(), loadStatsAndHistory()]);
        setRefreshing(false);
    }, [checkStatus, loadStatsAndHistory]);

    useEffect(() => {
        checkStatus();
        loadStatsAndHistory();
    }, [checkStatus, loadStatsAndHistory]);

    const pickFile = async () => {
        const picked = await new Promise((resolve) => {
            Alert.alert('Chọn nguồn tệp', null, [
                {
                    text: 'Thư viện ảnh',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            Toast.show({ type: 'error', text1: 'Cần quyền truy cập thư viện ảnh' });
                            return resolve(null);
                        }
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.All,
                            allowsMultipleSelection: false,
                            copyToCacheDirectory: true,
                        });
                        if (result.canceled) return resolve(null);
                        const asset = result.assets[0];
                        resolve({ uri: asset.uri, name: asset.fileName ?? asset.uri.split('/').pop(), mimeType: asset.mimeType, size: asset.fileSize });
                    },
                },
                {
                    text: 'Tệp',
                    onPress: async () => {
                        const result = await DocumentPicker.getDocumentAsync({
                            type: '*/*',
                            copyToCacheDirectory: true,
                            multiple: false,
                        });
                        if (result.canceled) return resolve(null);
                        resolve(result.assets?.[0] ?? null);
                    },
                },
                { text: 'Huỷ', style: 'cancel', onPress: () => resolve(null) },
            ]);
        });
        if (!picked) return;
        if (picked.size > 50 * 1024 * 1024) {
            Toast.show({ type: 'error', text1: 'File không được vượt quá 50MB' });
            return;
        }
        setSelectedImage(picked);
    };

    const handlePrint = async () => {
        if (!selectedImage) { Toast.show({ type: 'error', text1: 'Vui lòng chọn file để in' }); return; }
        if (!printerStatus)  { Toast.show({ type: 'error', text1: 'Máy in không khả dụng' });  return; }

        setPrinting(true);
        try {
            const { uri, name: filename, mimeType } = selectedImage;
            const mime = mimeType || 'application/octet-stream';

            const form = new FormData();
            form.append('file',        { uri, name: filename, type: mime });
            form.append('copies',      String(copies));
            form.append('duplex',      String(duplex));
            form.append('paperSize',   paperSize);
            form.append('orientation', orientation);
            form.append('fitToPage',   String(fitToPage));
            if (pageRange.trim()) form.append('pageRange', pageRange.trim());
            form.append('user',        user?.username || 'unknown');
            form.append('jobName',     filename);

            await api.post('/print', form, {
                requiresAuth: true,
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000,
            });

            Toast.show({ type: 'success', text1: 'Đã gửi lệnh in thành công' });
            setSelectedImage(null);
            loadStatsAndHistory();
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Lỗi khi gửi lệnh in' });
        } finally {
            setPrinting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Header title="In tài liệu" LeftIcon={ChevronLeft} onLeftPress={() => navigation.goBack()} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2E30" />
                }
            >

                {/* Status */}
                <View style={styles.statusCard}>
                    <View style={[styles.dot, {
                        backgroundColor: statusLoading ? '#9CA3AF'
                            : printerStatus === true  ? '#16A34A'
                            : printerStatus === false ? '#DC2626'
                            : '#9CA3AF',
                    }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statusText}>
                            {statusLoading ? 'Đang kiểm tra...'
                                : printerStatus === true  ? (printerName ?? 'Máy in đang hoạt động')
                                : printerStatus === false ? 'Máy in không khả dụng'
                                : 'Chưa kiểm tra'}
                        </Text>
                        {printerStatus === true && <Text style={styles.statusSub}>Sẵn sàng in</Text>}
                    </View>
                    <TouchableOpacity onPress={checkStatus} disabled={statusLoading} style={styles.refreshBtn}>
                        <Ionicons name="refresh" size={18} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* File picker */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chọn file</Text>
                    <TouchableOpacity style={styles.pickBtn} onPress={pickFile} activeOpacity={0.7}>
                        <Ionicons name="document-outline" size={20} color="#ED2E30" />
                        <Text style={styles.pickBtnText}>{selectedImage ? 'Đổi file' : 'Chọn từ Files'}</Text>
                    </TouchableOpacity>
                    {selectedImage && (
                        <View style={styles.fileInfo}>
                            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                            <Text style={styles.fileInfoText} numberOfLines={1}>{selectedImage.name}</Text>
                        </View>
                    )}
                    <Text style={styles.hint}>Hỗ trợ PDF, Word, Excel, PowerPoint, ảnh. Tối đa 50MB.</Text>
                </View>

                {/* Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tùy chọn in</Text>

                    {/* Số bản */}
                    <Text style={styles.optLabel}>Số bản in</Text>
                    <View style={styles.chipRow}>
                        {COPIES_OPTIONS.map((n) => (
                            <TouchableOpacity
                                key={n}
                                style={[styles.chip, copies === n && styles.chipActive]}
                                onPress={() => setCopies(n)}
                            >
                                <Text style={[styles.chipText, copies === n && styles.chipTextActive]}>{n}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.divider} />

                    {/* Khổ giấy */}
                    <Text style={styles.optLabel}>Khổ giấy</Text>
                    <View style={styles.chipRow}>
                        {PAPER_OPTIONS.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chip, paperSize === s && styles.chipActive]}
                                onPress={() => setPaperSize(s)}
                            >
                                <Text style={[styles.chipText, paperSize === s && styles.chipTextActive]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.divider} />

                    {/* Chiều giấy */}
                    <Text style={styles.optLabel}>Chiều giấy</Text>
                    <View style={styles.chipRow}>
                        {ORIENT_OPTIONS.map((o) => (
                            <TouchableOpacity
                                key={o.value}
                                style={[styles.chip, orientation === o.value && styles.chipActive]}
                                onPress={() => setOrientation(o.value)}
                            >
                                <Text style={[styles.chipText, orientation === o.value && styles.chipTextActive]}>{o.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.divider} />

                    {/* Phạm vi trang */}
                    <Text style={styles.optLabel}>Phạm vi trang</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="VD: 1-3, 1,3,5 hoặc để trống = tất cả"
                        placeholderTextColor="#9CA3AF"
                        value={pageRange}
                        onChangeText={setPageRange}
                        keyboardType="default"
                    />

                    <View style={styles.divider} />

                    {/* Duplex */}
                    <TouchableOpacity style={styles.toggleRow} onPress={() => setDuplex((v) => !v)} activeOpacity={0.7}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.optLabel}>In 2 mặt (Duplex)</Text>
                            <Text style={styles.optSub}>In cả hai mặt trang giấy</Text>
                        </View>
                        <Toggle value={duplex} onToggle={() => setDuplex((v) => !v)} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Fit to page */}
                    <TouchableOpacity style={styles.toggleRow} onPress={() => setFitToPage((v) => !v)} activeOpacity={0.7}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.optLabel}>Thu nhỏ vừa trang (Fit to page)</Text>
                            <Text style={styles.optSub}>Khuyến nghị khi in ảnh lớn</Text>
                        </View>
                        <Toggle value={fitToPage} onToggle={() => setFitToPage((v) => !v)} />
                    </TouchableOpacity>
                </View>

                {/* Print button */}
                <TouchableOpacity
                    style={[styles.printBtn, (!selectedImage || printing || !printerStatus) && styles.printBtnDisabled]}
                    onPress={handlePrint}
                    disabled={!selectedImage || printing || !printerStatus}
                    activeOpacity={0.8}
                >
                    {printing
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Ionicons name="print-outline" size={20} color="#fff" />}
                    <Text style={styles.printBtnText}>{printing ? 'Đang gửi lệnh in...' : 'In ngay'}</Text>
                </TouchableOpacity>

                {/* Stats */}
                {stats && (
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNum, { color: '#ED2E30' }]}>{stats.totalSheets ?? 0}</Text>
                            <Text style={styles.statLabel}>Tổng tờ đã in</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNum, { color: '#2563EB' }]}>{stats.totalJobs ?? 0}</Text>
                            <Text style={styles.statLabel}>Lần in</Text>
                        </View>
                    </View>
                )}

                {/* History */}
                {history.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Lịch sử in</Text>
                        {history.map((job, i) => (
                            <View key={job._id}>
                                {i > 0 && <View style={styles.divider} />}
                                <View style={styles.historyItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.historyFilename} numberOfLines={1}>{decodeFilename(job.filename)}</Text>
                                        <Text style={styles.historyMeta}>
                                            {job.pages ? `${job.pages} trang · ` : ''}{job.copies} bản · {job.paperSize}
                                            {job.duplex ? ' · 2 mặt' : ''}
                                        </Text>
                                        <Text style={styles.historyDate}>{formatDate(job.createdAt)}</Text>
                                    </View>
                                    <View style={styles.sheetsBadge}>
                                        <Text style={styles.sheetsBadgeNum}>{job.totalSheets}</Text>
                                        <Text style={styles.sheetsBadgeLabel}>tờ</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    scroll: { padding: 16, paddingBottom: 40 },

    statusCard: {
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    statusText: { fontSize: 14, color: '#374151', fontWeight: '600' },
    statusSub:  { fontSize: 12, color: '#16A34A', marginTop: 1 },
    refreshBtn: { padding: 4 },

    section: {
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
        borderColor: '#E5E7EB', padding: 16, marginBottom: 16,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 12 },

    pickBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#ED2E30', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start',
    },
    pickBtnText: { color: '#ED2E30', fontWeight: '600', fontSize: 14 },

    fileInfo: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
        backgroundColor: '#F0FDF4', borderRadius: 6, padding: 8,
    },
    fileInfoText: { flex: 1, fontSize: 13, color: '#15803D' },
    hint: { fontSize: 11, color: '#9CA3AF', marginTop: 10, lineHeight: 16 },

    optLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    optSub:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
        borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
    },
    chipActive:     { borderColor: '#ED2E30', backgroundColor: '#FEF2F2' },
    chipText:       { fontSize: 13, fontWeight: '600', color: '#374151' },
    chipTextActive: { color: '#ED2E30' },

    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

    textInput: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
    },

    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggle: {
        width: 44, height: 24, borderRadius: 12,
        backgroundColor: '#D1D5DB', padding: 2, justifyContent: 'center',
    },
    toggleActive:      { backgroundColor: '#ED2E30' },
    toggleThumb:       { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
    toggleThumbActive: { alignSelf: 'flex-end' },

    printBtn: {
        backgroundColor: '#ED2E30', borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14,
    },
    printBtnDisabled: { backgroundColor: '#D1D5DB' },
    printBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
        borderColor: '#E5E7EB', padding: 16, alignItems: 'center',
    },
    statNum:   { fontSize: 28, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },

    historyItem:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    historyFilename:{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 2 },
    historyMeta:    { fontSize: 12, color: '#6B7280' },
    historyDate:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    sheetsBadge: {
        alignItems: 'center', backgroundColor: '#FEF2F2',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    sheetsBadgeNum:   { fontSize: 18, fontWeight: '800', color: '#ED2E30' },
    sheetsBadgeLabel: { fontSize: 10, color: '#ED2E30', fontWeight: '600' },
});
