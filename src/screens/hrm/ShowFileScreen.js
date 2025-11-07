import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import FileViewer from '../../components/FileViewer'
import { store } from '../../redux/store'
import Header from '../../components/Header'

export default function ShowFileScreen() {
    const { auth } = store.getState()
    return (
        <View style={{ flex: 1 }}>
            <Header title={"Hợp đồng lao động"} />
            <View style={{flex: 1}}>
                <FileViewer
                    extension={"pdf"}
                    filename={"1762510881553-713959749.pdf"}
                    authToken={auth.accessToken} />
            </View>
        </View>
    )
}
