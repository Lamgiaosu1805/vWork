import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
import api from '../../api/axiosInstance'
import { store } from '../../redux/store'
import utils from '../../helpers/utils'

export default function DocumentInfoScreen({ navigation }) {
    const [listDocument, setListDocument] = useState([])

    const { auth } = store.getState()

    const documentUser = auth.user.documents
    useEffect(() => {
        const getListDocument = async () => {
            const res = await api.get('/document/getListDocument', { requiresAuth: true })
            setListDocument(res.data.data)
        }
        getListDocument()
    }, [])
    const renderDocumentItem = () => {
        return listDocument.map((document, index) => {
            // Tìm xem userDocument có chứa type._id trùng với document._id hay không
            const isProvided = documentUser.some(
                (item) => item.type?._id === document._id
            );

            return (
                <TouchableOpacity
                    onPress={() => isProvided
                        ? navigation.navigate('DocumentUserDetailScreen', {
                            documentDetail: documentUser.find(e => e.type?._id === document._id), title: document.name
                        })
                        : null}
                    activeOpacity={0.7}
                    key={document._id}
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 12,
                        borderBottomWidth: index === listDocument.length - 1 ? 0 : 1,
                        borderColor: "#E5E7EB",
                    }}
                >
                    <Text style={{ fontSize: 16, color: '#004643' }}>{document.name}</Text>

                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: "500",
                            color: isProvided ? "green" : "red",
                        }}
                    >
                        {isProvided ? "Đã cung cấp" : "Chưa cung cấp"}
                    </Text>
                </TouchableOpacity>
            );
        });
    };
    return (
        <View style={styles.container}>
            <Header
                title="Tài liệu hồ sơ"
                leftIconName="chevron-back-outline"
                onLeftPress={() => {
                    navigation.goBack()
                }}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 20,
                    paddingBottom: 30, // thêm nếu muốn có khoảng trống cuối
                }}
            >
                <View style={[styles.block, { paddingVertical: 8 }]}>
                    {
                        renderDocumentItem()
                    }
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    block: {
        padding: 16,
        backgroundColor: 'white',
        marginTop: 20,
        borderRadius: 8
    },
    image: {
        width: '100%',
        height: 300,
    },
})