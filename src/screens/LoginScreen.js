import {
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import React, { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/axiosInstance";
import { useCustomAlert } from "../components/CustomAlertProvider";
import Toast from "react-native-toast-message";
import ChangeFirstPasswordModal from "../components/ChangeFirstPasswordModal";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/slice/authSlice";

export default function LoginScreen({ navigation }) {
    const [visible, setVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [remember, setRemember] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [tempToken, setTempToken] = useState(null);
    const [loading, setLoading] = useState(false);

    const { showAlert } = useCustomAlert();
    const passwordRef = useRef(null);
      const dispatch = useDispatch();

    const handleLogin = async () => {
        try {
            if (username === "" || password === "") {
                showAlert("Thông báo", "Tài khoản và mật khẩu không được bỏ trống");
                return;
            }

            setLoading(true);

            const res = await api.post("/auth/login", { username, password });
            const data = res.data;

            if (data.isFirstLogin) {
                setShowChangePassword(true);
                setTempToken(data.tempToken);
                setLoading(false);
                return;
            } else {
                const { user, accessToken, refreshToken } = res.data;
                dispatch(setCredentials({ user, accessToken, refreshToken }));
                if (remember) {
                    await AsyncStorage.setItem("accessToken", accessToken);
                    await AsyncStorage.setItem("refreshToken", refreshToken);
                    // await AsyncStorage.setItem("user", JSON.stringify(user));
                } else {
                    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
                }

                const lastStack = (await AsyncStorage.getItem("lastStack")) || "WorkPlaceStackNavigator";
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: "RootDrawer",
                            params: { initialRoute: lastStack },
                        },
                    ],
                });
            }
        } catch (error) {
            console.log("Login error:", error.response?.data || error.message);
            showAlert("Thông báo", error.response?.data?.message || "Lỗi đăng nhập");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.containerMain}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 16 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={{ uri: "https://cdn-icons-png.flaticon.com/512/10984/10984874.png" }}
                            style={{ width: 100, height: 100 }}
                            resizeMode="contain"
                        />
                        <Text style={styles.appTitle}>X-Work</Text>
                    </View>

                    <View style={{ marginTop: 40, width: Dimensions.get("window").width - 48 }}>
                        <Text style={styles.titleInput}>Tên tài khoản</Text>
                        <TextInput
                            placeholder="Nhập tên tài khoản"
                            value={username}
                            onChangeText={setUsername}
                            style={styles.input}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            blurOnSubmit={false}
                        />

                        <Text style={[styles.titleInput, { marginTop: 18 }]}>Mật khẩu</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                ref={passwordRef}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!visible}
                                style={styles.inputPassword}
                            />
                            <TouchableOpacity style={{ marginRight: 12 }} onPress={() => setVisible(!visible)}>
                                <Ionicons name={visible ? "eye-off" : "eye"} size={24} color="#757575" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.rememberContainer}>
                            <TouchableOpacity
                                style={{ flexDirection: "row", alignItems: "center" }}
                                activeOpacity={0.8}
                                onPress={() => setRemember(!remember)}
                            >
                                <Ionicons
                                    name={remember ? "checkbox" : "checkbox-outline"}
                                    size={22}
                                    color="#004643"
                                />
                                <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.loginButton}
                            activeOpacity={0.7}
                            onPress={handleLogin}
                        >
                            <Text style={styles.loginText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            <ChangeFirstPasswordModal
                visible={showChangePassword}
                onClose={() => setShowChangePassword(false)}
                tempToken={tempToken}
                onSuccess={() => {
                    setShowChangePassword(false);
                    setPassword("");
                    Toast.show({
                        type: "success",
                        text1: "Thông báo",
                        text2: "Đổi mật khẩu thành công, vui lòng đăng nhập lại !",
                    });
                }}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    containerMain: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    appTitle: {
        fontSize: 20,
        marginTop: 16,
        fontWeight: "800",
        letterSpacing: 2,
        color: "#004643",
    },
    titleInput: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000",
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: "#C4C4C4",
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        fontSize: 14,
        color: "#333",
        marginBottom: 16,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#C4C4C4",
        borderRadius: 8,
    },
    inputPassword: {
        paddingHorizontal: 16,
        height: 48,
        fontSize: 14,
        color: "#333",
        flex: 1,
    },
    loginButton: {
        marginTop: 40,
        height: 48,
        backgroundColor: "#004643",
        borderRadius: 100,
        justifyContent: "center",
        alignItems: "center",
    },
    loginText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
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
    loadingOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingBox: {
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
});
