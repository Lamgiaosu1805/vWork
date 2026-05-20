import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated, Dimensions, Image, PanResponder,
    StyleSheet, Text, View, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import Header from '../../components/Header';
import utils from '../../helpers/utils';

const { width, height } = Dimensions.get('window');

const IMAGE_MIMES = new Set([
    'image/jpeg', 'image/jpg', 'image/png',
    'image/heic', 'image/heif', 'image/gif', 'image/webp',
]);

const getExt = (mime = '') => {
    const sub = mime.split('/')[1] ?? '';
    const map = { pdf: 'pdf', png: 'png', heic: 'heic', heif: 'heif', jpeg: 'jpg', jpg: 'jpg', gif: 'gif', webp: 'webp' };
    return map[sub] ?? sub;
};

const buildFileUrl = (file) => {
    if (file?._id) return `${utils.BASE_URL}/internal-files/file/${file._id}/view`;
    return null;
};

const fetchImageAsBase64 = async (url, headers, mimeType) => {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            let result = reader.result;
            if (mimeType && result?.startsWith('data:')) {
                result = `data:${mimeType};base64,${result.split(',')[1]}`;
            }
            resolve(result);
        };
        reader.onerror = () => reject(new Error('FileReader thất bại'));
        reader.readAsDataURL(blob);
    });
};

// ── Single file viewer pane ────────────────────────────────────────────────
function FilePane({ file, authToken, style }) {
    const [imageData, setImageData] = useState(null);
    const [imgLoading, setImgLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);

    const ext     = getExt(file?.mimeType);
    const fileUrl = buildFileUrl(file);
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const isImage = IMAGE_MIMES.has(file?.mimeType);
    const isPdf   = ext === 'pdf';
    // HEIC server đã convert → response là JPEG
    const responseMime = (ext === 'heic' || ext === 'heif') ? 'image/jpeg' : file?.mimeType;

    useEffect(() => {
        setImageData(null);
        setError(null);
        if (!isImage || !fileUrl) return;

        // Hủy fetch trước nếu còn đang chạy
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setImgLoading(true);
        fetchImageAsBase64(fileUrl, headers, responseMime)
            .then((dataUri) => {
                if (!controller.signal.aborted) setImageData(dataUri);
            })
            .catch((e) => {
                if (!controller.signal.aborted) setError(e.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setImgLoading(false);
            });

        return () => controller.abort();
    }, [file?._id, authToken]);

    const renderContent = () => {
        if (isPdf) {
            return (
                <Pdf
                    trustAllCerts={false}
                    source={{ uri: fileUrl, cache: true, headers }}
                    style={styles.pdf}
                    onError={() => setError('Không thể mở file PDF.')}
                    enablePaging
                    renderActivityIndicator={() => <ActivityIndicator size="large" color="#3B82F6" />}
                />
            );
        }

        if (isImage) {
            if (imgLoading) {
                return (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Đang tải ảnh...</Text>
                    </View>
                );
            }
            if (imageData) {
                return <Image source={{ uri: imageData }} style={styles.image} resizeMode="contain" />;
            }
        }

        if (error) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            );
        }

        return (
            <View style={styles.centered}>
                <Ionicons name="document-outline" size={48} color="#6B7280" />
                <Text style={styles.unsupportedText}>Loại file .{ext || '?'} không hỗ trợ xem trực tiếp.</Text>
                <Text style={styles.hintText}>Vui lòng mở trên vWork-website để xem.</Text>
            </View>
        );
    };

    return <Animated.View style={[styles.pane, style]}>{renderContent()}</Animated.View>;
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function WorkplaceFileViewerScreen() {
    const route = useRoute();
    const { files: fileList = [], initialIndex = 0, authToken } = route.params ?? {};

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const translateX = useRef(new Animated.Value(0)).current;
    const isAnimating = useRef(false);

    const currentFile = fileList[currentIndex];
    const hasPrev     = currentIndex > 0;
    const hasNext     = currentIndex < fileList.length - 1;
    const title       = decodeURIComponent(currentFile?.originalName ?? 'Xem file');

    const goTo = useCallback((nextIndex) => {
        if (isAnimating.current) return;
        isAnimating.current = true;
        const direction = nextIndex > currentIndex ? -1 : 1; // -1: slide left, +1: slide right
        Animated.timing(translateX, {
            toValue: direction * width,
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            translateX.setValue(-direction * width);
            setCurrentIndex(nextIndex);
            Animated.timing(translateX, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }).start(() => { isAnimating.current = false; });
        });
    }, [currentIndex, translateX]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
            onPanResponderMove: (_, g) => {
                if (isAnimating.current) return;
                translateX.setValue(g.dx);
            },
            onPanResponderRelease: (_, g) => {
                if (isAnimating.current) return;
                const THRESHOLD = width * 0.3;
                if (g.dx < -THRESHOLD) {
                    // Vuốt trái → file tiếp theo
                    setCurrentIndex((ci) => {
                        if (ci >= fileList.length - 1) {
                            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                            return ci;
                        }
                        isAnimating.current = true;
                        Animated.timing(translateX, { toValue: -width, duration: 220, useNativeDriver: true })
                            .start(() => {
                                translateX.setValue(width);
                                Animated.timing(translateX, { toValue: 0, duration: 180, useNativeDriver: true })
                                    .start(() => { isAnimating.current = false; });
                            });
                        return ci + 1;
                    });
                } else if (g.dx > THRESHOLD) {
                    // Vuốt phải → file trước
                    setCurrentIndex((ci) => {
                        if (ci <= 0) {
                            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                            return ci;
                        }
                        isAnimating.current = true;
                        Animated.timing(translateX, { toValue: width, duration: 220, useNativeDriver: true })
                            .start(() => {
                                translateX.setValue(-width);
                                Animated.timing(translateX, { toValue: 0, duration: 180, useNativeDriver: true })
                                    .start(() => { isAnimating.current = false; });
                            });
                        return ci - 1;
                    });
                } else {
                    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            },
        })
    ).current;

    if (!currentFile) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['bottom']}>
                <Header title="Xem file" />
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Không tìm thấy file.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <Header title={title} />

            {/* Counter + navigation */}
            {fileList.length > 1 && (
                <View style={styles.navBar}>
                    <TouchableOpacity
                        style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
                        onPress={() => hasPrev && goTo(currentIndex - 1)}
                        disabled={!hasPrev}
                    >
                        <Ionicons name="chevron-back" size={18} color={hasPrev ? '#fff' : '#555'} />
                    </TouchableOpacity>
                    <Text style={styles.counter}>{currentIndex + 1} / {fileList.length}</Text>
                    <TouchableOpacity
                        style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
                        onPress={() => hasNext && goTo(currentIndex + 1)}
                        disabled={!hasNext}
                    >
                        <Ionicons name="chevron-forward" size={18} color={hasNext ? '#fff' : '#555'} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Swipe area */}
            <View style={styles.swipeContainer} {...panResponder.panHandlers}>
                <FilePane
                    file={currentFile}
                    authToken={authToken}
                    style={{ transform: [{ translateX }] }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea:        { flex: 1, backgroundColor: '#1A1A1A' },
    swipeContainer:  { flex: 1, overflow: 'hidden' },
    pane:            { flex: 1 },

    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 8,
        backgroundColor: '#1A1A1A',
    },
    navBtn:         { padding: 6 },
    navBtnDisabled: { opacity: 0.3 },
    counter:        { color: '#9CA3AF', fontSize: 13, fontWeight: '600', minWidth: 60, textAlign: 'center' },

    pdf:      { flex: 1, width, height },
    image:    { flex: 1, width, height },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },

    loadingText:     { color: '#9CA3AF', fontSize: 13, marginTop: 8 },
    errorText:       { color: '#EF4444', fontSize: 14, textAlign: 'center' },
    unsupportedText: { color: '#fff', fontSize: 14, textAlign: 'center', fontWeight: '500' },
    hintText:        { color: '#6B7280', fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
});
