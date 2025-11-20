// src/screens/SplashScreen.js
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/slice/authSlice";
import api from "../api/axiosInstance";
import dayjs from "dayjs";


export default function SplashScreen({ navigation }) {
    const dispatch = useDispatch();

    useEffect(() => {
        const init = async () => {
            try {
                const today = dayjs().format("YYYY-MM-DD");
                await AsyncStorage.setItem("LAST_OPEN_DATE", today);
                const accessToken = await AsyncStorage.getItem("accessToken");
                const res = await api.get("/user/getUserInfo", { requiresAuth: true });
                // console.log(JSON.stringify(res.data, null, 2));
                if (accessToken) {
                    dispatch(
                        setCredentials({
                            accessToken,
                            user: res.data,
                        })
                    );
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "RootDrawer" }],
                    });
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "LoginScreen" }],
                    });
                }
            } catch (e) {
                console.log("Lỗi khi load SplashScreen")
                console.log(e.response?.data || e)
                navigation.reset({
                    index: 0,
                    routes: [{ name: "LoginScreen" }],
                });
            }
        };

        init();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#004643" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
});
