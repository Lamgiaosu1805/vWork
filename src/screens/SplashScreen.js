import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { router } from "expo-router";
import { setCredentials } from "../redux/slice/authSlice";
import api from "../api/axiosInstance";
import dayjs from "dayjs";
import { getAccessToken } from "../libs/secureTokenStorage";
import { getPermissions } from "../helpers/permissions";
import { resolveInitialRoute } from "../helpers/lastStack";

export default function SplashScreen() {
    const dispatch = useDispatch();

    useEffect(() => {
        const init = async () => {
            try {
                const today = dayjs().format("YYYY-MM-DD");
                await AsyncStorage.setItem("LAST_OPEN_DATE", today);
                const accessToken = await getAccessToken();
                const res = await api.get("/user/getUserInfo", { requiresAuth: true });
                if (accessToken) {
                    dispatch(
                        setCredentials({
                            accessToken,
                            user: res.data,
                        })
                    );
                    const hasCrm = getPermissions(res.data).showCRM;
                    const target = await resolveInitialRoute(hasCrm);
                    router.replace(`/${target}`);
                } else {
                    router.replace("/login");
                }
            } catch (e) {
                console.log("Lỗi khi load SplashScreen")
                console.log(e.response?.data || e)
                router.replace("/login");
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
