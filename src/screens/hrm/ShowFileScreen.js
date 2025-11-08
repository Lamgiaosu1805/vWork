import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import FileViewer from '../../components/FileViewer'
import { store } from '../../redux/store'
import Header from '../../components/Header'
import utils from '../../helpers/utils'

export default function ShowFileScreen() {
    const { auth } = store.getState()
    console.log(auth.user.laborContracts)
    return (
        <View style={{ flex: 1 }}>
            <Header title={"Hợp đồng lao động"} />
            <View style={{flex: 1}}>
                <FileViewer
                    extension={"pdf"}
                    filename={utils.getFileExtension(auth.user?.laborContracts[0].file_url).fileName}
                    authToken={auth.accessToken} />
            </View>
        </View>
    )
}
