import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import Header from '../../components/Header'
import utils from '../../helpers/utils'
import FileViewer from '../../components/FileViewer'
import { store } from '../../redux/store'

export default function DocumentUserDetail({ route, navigation }) {
    const [currentAttachment, setCurrentAttachment] = useState(null)
    const { params } = route
    const listAttachment = params.documentDetail?.attachments || []
    const { auth } = store.getState()
    // console.log(utils.getFileExtension(listAttachment[0].file_url))
    const renderPreview = () => {
        return listAttachment.map((e, ind) => (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setCurrentAttachment(e) }}
                key={ind}
                style={{
                    width: 120,
                    height: 160,
                    backgroundColor: currentAttachment?.file_name == e?.file_name ? 'grey' : 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 32,
                    borderRadius: 12,
                    paddingHorizontal: 8
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: '600' }}>.{utils.getFileExtension(e.file_url).extension} file</Text>
                <Text style={{ fontSize: 14, fontWeight: '400', marginTop: 12 }}>{e.file_name}</Text>
            </TouchableOpacity>
        ))
    }
    return (
        <View style={styles.container}>
            <Header
                title={params.title}
                leftIconName="chevron-back-outline"
                onLeftPress={() => {
                    navigation.goBack()
                }}
            />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 20,
                    paddingBottom: 30, // thêm nếu muốn có khoảng trống cuối
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
                    {
                        renderPreview()
                    }
                </View>
                <Text style={{ alignSelf: 'center', marginTop: 32, marginBottom: 20 }}>PREVIEW</Text>
                {
                    currentAttachment != null && (
                        <FileViewer
                            extension={utils.getFileExtension(currentAttachment?.file_url).extension}
                            filename={utils.getFileExtension(currentAttachment?.file_url).fileName}
                            authToken={auth.accessToken}
                        />
                    )
                }
            </ScrollView>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})