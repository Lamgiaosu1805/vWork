import { Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function LoginScreen() {
    const [visible, setVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [remember, setRemember] = useState(false);

    const passwordRef = useRef(null);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined} // Để undefined cho Android
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ alignItems: 'center' }}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/10984/10984874.png' }}
                            style={{ width: 100, height: 100 }}
                            resizeMode='contain'
                        />
                        <Text style={{ fontSize: 20, marginTop: 16, fontWeight: '800', letterSpacing: 2, color: '#004643' }}>
                            X-Work
                        </Text>
                    </View>

                    <View style={{ marginTop: 40, width: Dimensions.get('window').width - 48 }}>
                        <Text style={styles.titleInput}>Tên tài khoản</Text>
                        <TextInput
                            placeholder="Nhập tên tài khoản"
                            value={username}
                            onChangeText={setUsername}
                            style={styles.input}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            blurOnSubmit={false} // 👈 tránh ẩn bàn phím
                        />

                        <Text style={[styles.titleInput, { marginTop: 18 }]}>Mật khẩu</Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: "#C4C4C4",
                            borderRadius: 8,
                        }}>
                            <TextInput
                                ref={passwordRef}
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

                        <View
                            style={styles.rememberContainer}
                        >
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} activeOpacity={0.8} onPress={() => setRemember(!remember)}>
                                <Ionicons
                                    name={remember ? "checkbox" : "checkbox-outline"}
                                    size={22}
                                    color="#004643"
                                />
                                <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={{
                                marginTop: 40,
                                height: 48,
                                backgroundColor: '#004643',
                                borderRadius: 100,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                                Đăng nhập
                            </Text>
                        </TouchableOpacity>
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
    },
    rememberContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
    },
    rememberText: {
        marginLeft: 8,
        fontSize: 14,
        color: "#333",
    },
})