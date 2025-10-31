import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const Header = ({
    title,
    leftIconName,
    onLeftPress,
    rightIconName,
    onRightPress
}) => {
    const insets = useSafeAreaInsets();
    
    const ICON_SIZE = 24;
    const ICON_COLOR = '#004643';

    const renderIcon = (name, onPress) => {
        if (!name) {
            return <View style={styles.iconPlaceholder} />;
        }

        return (
            <TouchableOpacity
                onPress={onPress}
                style={styles.iconContainer}
                disabled={!onPress}
            >
                <Ionicons name={name} size={ICON_SIZE} color={ICON_COLOR} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            
            {renderIcon(leftIconName, onLeftPress)}

            <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
            </View>

            {renderIcon(rightIconName, onRightPress)}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff', 
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 16
    },
    iconContainer: {
        width: 40, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconPlaceholder: {
        width: 40,
        height: '100%',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#004643',
    },
});

export default Header;