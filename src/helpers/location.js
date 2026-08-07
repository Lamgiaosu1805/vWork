import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export const ensureLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert(
            'Quyền vị trí bị tắt',
            'Ứng dụng cần quyền truy cập vị trí để lấy vị trí hiện tại và tên Wi-Fi. Mở cài đặt để bật lại?',
            [
                { text: 'Huỷ', style: 'cancel' },
                { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
            ],
        );
        return false;
    }
    return true;
};
