import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { setCredentials } from "../redux/slice/authSlice";
import dayjs from "dayjs";
import { getAccessToken } from "../libs/secureTokenStorage";
import { resolveInitialRoute } from "../features/auth/lib/resolveInitialRoute";
import useFetchUserInfoWithToken from "../features/auth/hooks/useFetchUserInfoWithToken";
import { permissionApi, hasAnyPermission, CRM_ACCESS_PERMISSIONS, HRM_ACCESS_PERMISSIONS } from "../features/permission";

export default function SplashScreen() {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const fetchUserInfoMutation = useFetchUserInfoWithToken();

    useEffect(() => {
        const init = async () => {
            try {
                const today = dayjs().format("YYYY-MM-DD");
                await AsyncStorage.setItem("LAST_OPEN_DATE", today);
                const accessToken = await getAccessToken();
                if (accessToken) {
                    const res = await fetchUserInfoMutation.mutateAsync(accessToken);
                    dispatch(
                        setCredentials({
                            accessToken,
                            user: res.data,
                        })
                    );
                    let myPermissions = [];
                    try {
                        const permsRes = await permissionApi.getMyPermissions();
                        myPermissions = permsRes.data?.data?.permissions ?? [];
                        queryClient.setQueryData(["my-effective-permissions"], myPermissions);
                    } catch (permErr) {
                        console.log("Lỗi khi lấy /permissions/me:", permErr.response?.data || permErr);
                    }
                    const hasCrm = hasAnyPermission(myPermissions, CRM_ACCESS_PERMISSIONS);
                    const hasHrm = hasAnyPermission(myPermissions, HRM_ACCESS_PERMISSIONS);
                    const target = await resolveInitialRoute({ hasCrm, hasHrm });
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
