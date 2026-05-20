import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

/**
 * Header chuẩn dùng chung toàn app.
 *
 * Props:
 *   title      — tiêu đề (bắt buộc)
 *   subtitle   — dòng phụ nhỏ bên dưới title (tuỳ chọn)
 *   onBack     — hiện nút back bên trái; true = goBack(), function = custom handler
 *   onMenu     — hiện nút hamburger mở drawer (dùng cho bottom tab screens)
 *   action     — React element tuỳ chọn bên phải (icon lọc, nút...)
 */
export default function ScreenHeader({ title, subtitle, onBack, onMenu, action }) {
    const navigation = useNavigation();

    const handleBack = () => {
        if (typeof onBack === 'function') onBack();
        else navigation.goBack();
    };

    const hasLeft = onBack || onMenu;

    return (
        <View style={styles.header}>
            {onBack ? (
                <TouchableOpacity onPress={handleBack} style={styles.leftBtn} hitSlop={8}>
                    <Ionicons name="arrow-back" size={22} color="#111827" />
                </TouchableOpacity>
            ) : onMenu ? (
                <TouchableOpacity onPress={onMenu} style={styles.leftBtn} hitSlop={8}>
                    <Ionicons name="menu" size={24} color="#111827" />
                </TouchableOpacity>
            ) : null}

            <View style={styles.titleWrap}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>

            {action ? (
                <View style={styles.actionWrap}>{action}</View>
            ) : (
                hasLeft ? <View style={styles.actionPlaceholder} /> : null
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 10,
    },
    leftBtn: {
        padding: 4,
        flexShrink: 0,
    },
    titleWrap: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    actionWrap: {
        flexShrink: 0,
    },
    actionPlaceholder: {
        width: 30,
        flexShrink: 0,
    },
});
