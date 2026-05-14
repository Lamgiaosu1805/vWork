import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import Header from '../../components/Header';
import utils from '../../helpers/utils';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
const PDF_EXT = 'pdf';

const getExtFromMime = (mime = '') => {
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('png')) return 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    return mime.split('/')[1] ?? '';
};

// Xây dựng URL xem file — ưu tiên filename, fallback _id
const buildFileUrl = (file) => {
    if (file?.filename) return `${utils.BASE_URL}/document/getFile?filename=${file.filename}`;
    if (file?._id) return `${utils.BASE_URL}/internal-files/file/${file._id}`;
    return null;
};

export default function WorkplaceFileViewerScreen() {
    const route = useRoute();
    const { file, authToken } = route.params ?? {};
    const [error, setError] = useState(null);

    const ext = getExtFromMime(file?.mimeType);
    const fileUrl = buildFileUrl(file);
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const title = file?.originalName ?? 'Xem file';

    if (!fileUrl) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['bottom']}>
                <Header title={title} />
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Không tìm thấy thông tin file.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <Header title={title} />
            <View style={styles.content}>
                {ext === PDF_EXT ? (
                    <Pdf
                        trustAllCerts={false}
                        source={{ uri: fileUrl, cache: true, headers }}
                        style={styles.pdf}
                        onLoadComplete={(pages) => console.log(`PDF loaded: ${pages} pages`)}
                        onError={(e) => { console.log('PDF error:', e); setError('Không thể mở file PDF này.'); }}
                        enablePaging
                        horizontal={false}
                        renderActivityIndicator={() => (
                            <ActivityIndicator size="large" color="#3B82F6" />
                        )}
                    />
                ) : IMAGE_EXTS.includes(ext.toUpperCase()) || IMAGE_EXTS.includes(ext) ? (
                    // Ảnh — dùng Image với headers qua URI
                    // react-native Image không hỗ trợ headers trực tiếp → hiển thị thông báo
                    <View style={styles.centered}>
                        <Text style={styles.unsupportedText}>
                            Để xem ảnh có xác thực, vui lòng mở trên web.
                        </Text>
                        <Text style={styles.fileNameText}>{file?.originalName}</Text>
                    </View>
                ) : (
                    <View style={styles.centered}>
                        <Text style={styles.unsupportedText}>
                            Loại file .{ext} không hỗ trợ xem trực tiếp.
                        </Text>
                        <Text style={styles.fileNameText}>{file?.originalName}</Text>
                        <Text style={styles.hintText}>
                            Vui lòng mở file từ vWork-website để xem đầy đủ.
                        </Text>
                    </View>
                )}

                {error && (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1A1A1A' },
    content: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
    pdf: { flex: 1, width, height },
    errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
    unsupportedText: { color: '#fff', fontSize: 14, textAlign: 'center', fontWeight: '500' },
    fileNameText: { color: '#9CA3AF', fontSize: 12, textAlign: 'center' },
    hintText: { color: '#6B7280', fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
});
