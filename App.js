import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootStackNavigator } from './src/navigators/RootStackNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootStackNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


