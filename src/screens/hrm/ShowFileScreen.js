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
                <View>
                    <Text>Số hợp đồng: {auth.user?.laborContracts[0]?.contract_number}</Text>
                    <Text>Loại hợp đồng: {utils.getTypeLaborContract(auth.user?.laborContracts[0]?.type)}</Text>
                    <Text>Loại hợp đồng: {utils.getStatusLaborContract(auth.user?.laborContracts[0]?.status)}</Text>
                    <Text>Từ {utils.formatDate(auth.user?.laborContracts[0]?.start_date)} - {utils.formatDate(auth.user?.laborContracts[0]?.end_date)}</Text>
                </View>
                <FileViewer
                    extension={"pdf"}
                    filename={utils.getFileExtension(auth.user?.laborContracts[0]?.file_url).fileName}
                    authToken={auth.accessToken} />
            </View>
        </View>
    )
}
