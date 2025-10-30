import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import { StatusBar } from 'expo-status-bar';
import RootDrawerNavigator from './RootDrawerNavigator';

const Stack = createNativeStackNavigator();

export function RootStackNavigator() {
    return (
        <NavigationContainer>
            <StatusBar style="auto" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
                <Stack.Screen name="RootDrawer" component={RootDrawerNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}