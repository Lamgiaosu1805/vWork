import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootStackNavigator } from './src/navigators/RootStackNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootStackNavigator />
    </GestureHandlerRootView>
  );
}


