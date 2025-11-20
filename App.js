import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootStackNavigator } from './src/navigators/RootStackNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { CustomAlertProvider } from './src/components/CustomAlertProvider';
import Toast from 'react-native-toast-message';

export default function App() {

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
