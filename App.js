import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootStackNavigator } from './src/navigators/RootStackNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { CustomAlertProvider } from './src/components/CustomAlertProvider';
import Toast from 'react-native-toast-message';
import WifiManager from 'react-native-wifi-reborn';
import { Alert, Linking, AppState } from 'react-native';
import * as Location from 'expo-location';

export default function App() {
  // Hàm lấy SSID có xử lý lỗi đúng cách
  // const getSSID = async () => {
  //   try {
  //     const ssid = await WifiManager.getCurrentWifiSSID();
  //     let location = await Location.getCurrentPositionAsync({});
  //     console.log('Location:', location);
  //     console.log('SSID:', ssid)
  //     return ssid;
  //   } catch (error) {
  //     console.log('Lỗi lấy SSID:', error?.message || error);
  //     Alert.alert(
  //       'Quyền vị trí bị tắt',
  //       'Ứng dụng cần quyền truy cập vị trí để lấy vị trí hiện tại và tên Wi-Fi. Mở cài đặt để bật lại?',
  //       [
  //         { text: 'Huỷ', style: 'cancel' },
  //         { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
  //       ],
  //     );
  //     return null;
  //   }
  // };

  // useEffect(() => {
  //   let isActive = true;

  //   const handleAppStateChange = (state) => {
  //     if (state === 'active' && isActive) {
  //       // Chờ 0.5s để iOS cập nhật quyền mới sau khi user bật lại
  //       setTimeout(() => {
  //         getSSID();
  //       }, 500);
  //     }
  //   };

  //   const sub = AppState.addEventListener('change', handleAppStateChange);

  //   // Gọi 1 lần khi khởi động app
  //   getSSID();

  //   return () => {
  //     isActive = false;
  //     sub.remove();
  //   };
  // }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CustomAlertProvider>
        <SafeAreaProvider>
          <Provider store={store}>
            <RootStackNavigator />
            <Toast />
          </Provider>
        </SafeAreaProvider>
      </CustomAlertProvider>
    </GestureHandlerRootView>
  );
}
