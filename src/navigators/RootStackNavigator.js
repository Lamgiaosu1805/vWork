import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import { StatusBar } from 'expo-status-bar';
import RootDrawerNavigator from './RootDrawerNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import { navigationRef } from '../helpers/navigationRef';

const Stack = createNativeStackNavigator();

export function RootStackNavigator() {
    return (
        <NavigationContainer ref={navigationRef}>
            <StatusBar style="auto" />
            <Stack.Navigator 
                screenOptions={{ headerShown: false }}>
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
                <Stack.Screen name="RootDrawer" component={RootDrawerNavigator} />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        headerShown: true,
                        headerTitle: 'Cài đặt',
                        headerTintColor: '#004643',
                        headerStyle: { backgroundColor: '#fff' },
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}