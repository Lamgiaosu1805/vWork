import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
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

import { canMgr } from '../../helpers/permissions';
import feedApi from '../../api/feedApi';

const BRAND = '#ED2E30';
const MAX_IMAGES = 4;

export default function ComposePostScreen({ navigation }) {
    const user = useSelector((state) => state.auth.user);
    const canManage = canMgr(user, 'workplace');

    const [content, setContent] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [images, setImages] = useState([]); // { uri, name, type }
    const [submitting, setSubmitting] = useState(false);

    const handlePickImages = async () => {
        const remaining = MAX_IMAGES - images.length;
        if (remaining <= 0) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 0.8,
        });

        if (result.canceled) return;

        const picked = result.assets.map((a) => ({
            uri: a.uri,
            name: decodeURIComponent(a.fileName ?? a.uri.split('/').pop()),
            type: a.mimeType ?? 'image/jpeg',
        }));
        setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
    };

    const handleRemoveImage = (idx) => {
        setImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', content.trim());
            formData.append('type', isAnnouncement ? 'announcement' : 'post');
            images.forEach((img) => {
                formData.append('images', {
                    uri: img.uri,
                    name: img.name,
                    type: img.type,
                });
            });
            await feedApi.createPost(formData);
            Toast.show({ type: 'success', text1: 'Đăng bài thành công' });
            navigation.goBack();
        } catch (err) {
            Toast.show({ type: 'error', text1: err?.message ?? 'Đăng bài thất bại' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        if (content.trim() || images.length > 0) {
            Alert.alert('Hủy đăng bài?', 'Nội dung bạn đã nhập sẽ bị mất.', [
                { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
                { text: 'Hủy', style: 'destructive', onPress: () => navigation.goBack() },
            ]);
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
                    <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isAnnouncement ? 'Đăng thông báo' : 'Đăng bài mới'}
                </Text>
                <TouchableOpacity
                    style={[styles.submitBtn, (!content.trim() || submitting) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!content.trim() || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Đăng</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.body}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Chia sẻ điều gì đó với mọi người..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        autoFocus
                        value={content}
                        onChangeText={setContent}
                        maxLength={2000}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{content.length}/2000</Text>

                    {/* Announcement toggle */}
                    {canManage && (
                        <View style={styles.toggleRow}>
                            <View>
                                <Text style={styles.toggleLabel}>Đăng dưới dạng thông báo</Text>
                                <Text style={styles.toggleSub}>Hiển thị nhãn "Thông báo"</Text>
                            </View>
                            <Switch
                                value={isAnnouncement}
                                onValueChange={setIsAnnouncement}
                                trackColor={{ true: BRAND }}
                                thumbColor="#fff"
                            />
                        </View>
                    )}

                    {/* Image picker */}
                    {images.length < MAX_IMAGES && (
                        <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImages}>
                            <Ionicons name="image-outline" size={18} color="#6B7280" />
                            <Text style={styles.addImageText}>
                                Thêm ảnh ({images.length}/{MAX_IMAGES})
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Image previews */}
                    {images.length > 0 && (
                        <View style={styles.imageGrid}>
                            {images.map((img, idx) => (
                                <View key={idx} style={styles.imageThumb}>
                                    <Image source={{ uri: img.uri }} style={styles.thumbImg} />
                                    <TouchableOpacity
                                        style={styles.removeImgBtn}
                                        onPress={() => handleRemoveImage(idx)}
                                    >
                                        <Ionicons name="close" size={14} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerBtn: { minWidth: 50 },
    cancelText: { fontSize: 15, color: '#6B7280' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111827' },
    submitBtn: {
        backgroundColor: BRAND,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 7,
        minWidth: 50,
        alignItems: 'center',
    },
    submitBtnDisabled: { backgroundColor: '#D1D5DB' },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    body: { padding: 16, paddingBottom: 40 },
    textInput: {
        fontSize: 16,
        color: '#111827',
        minHeight: 140,
        textAlignVertical: 'top',
        lineHeight: 22,
    },
    charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 12,
    },
    toggleLabel: { fontSize: 14, color: '#111827', fontWeight: '500' },
    toggleSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    addImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    addImageText: { fontSize: 13, color: '#6B7280' },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    imageThumb: {
        width: '47%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeImgBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 10,
        padding: 2,
    },
});
