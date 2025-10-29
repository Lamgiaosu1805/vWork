import { Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useState } from 'react'
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function LoginScreen() {
    const [visible, setVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ width: Dimensions.get('screen').width, paddingHorizontal: 16, marginTop: 68, flex: 1 }}>

                        {/* <Text style={{ alignSelf: 'center', marginTop: 32, color: '#004643', fontSize: 20, fontWeight: '500' }}>Đăng nhập</Text> */}
                        <View style={{ flex: 1, paddingHorizontal: 8, justifyContent: 'center' }}>
                            <View style={{ alignItems: 'center' }}>
                                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/10984/10984874.png' }} width={100} height={100} resizeMode='contain' />
                                <Text style={{ fontSize: 20, marginTop: 16, fontWeight: '800', letterSpacing: 2, color: '#004643' }}>X-Work</Text>
                            </View>
                            <View style={{ marginTop: 72 }}>
                                <Text style={styles.titleInput}>Tên tài khoản</Text>
                                <TextInput
                                    placeholder="Nhập tên tài khoản"
                                    value={username}
                                    onChangeText={setUsername}
                                    style={styles.input}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                />
                            </View>
                            <View style={{ marginTop: 18 }}>
                                <Text style={styles.titleInput}>Mật khẩu</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: "#C4C4C4",
                                    borderRadius: 8,
                                }}>
                                    <TextInput
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!visible}
                                        style={styles.inputPassword}
                                    />
                                    <TouchableOpacity style={{ marginRight: 12 }} activeOpacity={0.7} onPress={() => setVisible(!visible)}>
                                        <Ionicons name={visible ? "eye-off" : "eye"} size={24} color="#757575" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity style={{ marginTop: 40, height: 48, backgroundColor: '#004643', borderRadius: 100, justifyContent: 'center', alignItems: 'center' }} activeOpacity={0.7}>
                                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                                    Đăng nhập
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        width: "100%",
    },
    input: {
        borderWidth: 1,
        borderColor: "#C4C4C4",
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        fontSize: 14,
        marginBottom: 16,
        color: "#333",
    },
    inputPassword: {
        paddingHorizontal: 16,
        height: 48,
        fontSize: 14,
        color: "#333",
        flex: 1,
    },
    titleInput: {
        fontSize: 14,
        fontWeight: 'semibold',
        color: '#000000',
        marginBottom: 6,
    }
})