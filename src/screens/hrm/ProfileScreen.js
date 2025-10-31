import { Alert, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from '../../components/Header'
import { openDrawer } from '../../helpers/navigationRef'

export default function ProfileScreen() {
    return (
        <View style={styles.container}>
            <Header
                title="Hồ sơ cá nhân"
                leftIconName="menu"
                onLeftPress={() => {
                    openDrawer()
                }}
                rightIconName="notifications"
                onRightPress={() => Alert.alert('Notifications Pressed')}
            />
            <Text>sfdfdfdf</Text>
        </View>
        
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})