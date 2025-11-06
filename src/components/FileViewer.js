import { Image, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import utils from '../helpers/utils';

export default function FileViewer({ filename, extension, authToken }) {
    const [localUri, setLocalUri] = useState(null);
    const [loading, setLoading] = useState(true);

    if (!filename) return <Text>Không có file đính kèm.</Text>;

    const fileUrl = `${utils.BASE_URL}/document/getFile?filename=${filename}`;
    const headers = { Authorization: `Bearer ${authToken}` };

    useEffect(() => {
        let fileUri = null;

        const downloadFile = async () => {
            if (!extension || extension.toLowerCase() !== 'pdf') {
                setLoading(false);
                return;
            }

            try {
                //Lưu file vào thư mục cache (tạm thời)
                fileUri = FileSystem.cacheDirectory + filename;

                const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri, {
                    headers,
                });

                setLocalUri(uri);
            } catch (err) {
                console.log('⚠️ Lỗi tải file PDF:', err);
            } finally {
                setLoading(false);
            }
        };

        downloadFile();

        // Xóa file khi unmount (tránh đầy bộ nhớ)
        return () => {
            if (fileUri) {
                FileSystem.deleteAsync(fileUri, { idempotent: true })
                    .then(() => console.log('🧹 Đã xóa file cache:', fileUri))
                    .catch(() => { });
            }
        };
    }, [filename, extension]);

    // 1. IMAGE
    if (['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'].includes(extension)) {
        return (
            <Image
                source={{
                    uri: fileUrl,
                    headers: headers,
                }}
                style={styles.image}
                resizeMode="contain"
            />
        );
    }

    // 2. PDF
    if (extension.toLowerCase() === 'pdf') {
        if (loading)
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                    <Text>Đang tải file PDF...</Text>
                </View>
            );

        if (!localUri)
            return (
                <Text style={styles.placeholder}>
                    Không thể tải hoặc hiển thị file PDF.
                </Text>
            );

        return (
            <WebView
                originWhitelist={['*']}
                source={{ uri: localUri }}
                style={styles.pdf}
            />
        );
    }

    // 3️⃣ FILE KHÔNG HỖ TRỢ
    return (
        <Text style={styles.placeholder}>
            Loại file .{extension} không được hỗ trợ hiển thị trực tiếp.
        </Text>
    );
}

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 300,
    },
    pdf: {
        flex: 1,
    },
    placeholder: {
        padding: 20,
        textAlign: 'center',
        color: '#888',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
