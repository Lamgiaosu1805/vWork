import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
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
import { router } from "expo-router";
import { useCustomAlert } from "../components/CustomAlertProvider";
import Toast from "react-native-toast-message";
import ChangeFirstPasswordModal from "../features/auth/components/ChangeFirstPasswordModal";
import useLogin from "../features/auth/hooks/useLogin";
import useFetchUserInfoWithToken from "../features/auth/hooks/useFetchUserInfoWithToken";
import { resolveInitialRoute } from "../features/auth/lib/resolveInitialRoute";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { setCredentials } from "../redux/slice/authSlice";
import {
  setAccessToken as saveAccessToken,
  setRefreshToken as saveRefreshToken,
  removeAccessToken,
} from "../libs/secureTokenStorage";
import { syncFcmTokenWithServer } from "../utils/notifications/fcmConfig";
import { permissionApi, hasAnyPermission, CRM_ACCESS_PERMISSIONS, HRM_ACCESS_PERMISSIONS } from "../features/permission";
import { Icons } from "../assets/icons";
import { Images } from "../assets/images";
import useTheme from "../assets/theme/useTheme";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../assets/theme/colors";
import { Eye, EyeOff } from "lucide-react-native";

export default function LoginScreen() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [remember, setRemember] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempToken, setTempToken] = useState(null);

  const { showAlert } = useCustomAlert();
  const passwordRef = useRef(null);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const fetchUserInfoMutation = useFetchUserInfoWithToken();

  const handleLogin = async () => {
    try {
      if (username === "" || password === "") {
        showAlert("Thông báo", "Tài khoản và mật khẩu không được bỏ trống");
        return;
      }

      const res = await loginMutation.mutateAsync({ username, password });
      const data = res.data;

      if (data.isFirstLogin) {
        setShowChangePassword(true);
        setTempToken(data.tempToken);
        return;
      } else {
        const { accessToken, refreshToken } = res.data;
        const resUserInfo = await fetchUserInfoMutation.mutateAsync(accessToken);
        const user = resUserInfo.data;
        dispatch(setCredentials({ user, accessToken, refreshToken }));

        if (remember) {
          await saveAccessToken(accessToken);
        } else {
          await removeAccessToken();
        }
        await saveRefreshToken(refreshToken);
        syncFcmTokenWithServer();

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
      }
    } catch (error) {
      console.log("Login error:", error.response?.data || error.message);
      showAlert("Thông báo", error.response?.data?.message || "Lỗi đăng nhập");
    }
  };

  const isLoggingIn = loginMutation.isPending || fetchUserInfoMutation.isPending;

  return (
    <ImageBackground
      source={Images.BackgroundLogin}
      resizeMode="cover"
      style={{
        flex: 1,
        backgroundColor: theme.colors.white,
      }}
      imageStyle={{
        position: "absolute",
        bottom: 0,
      }}
    >
      <KeyboardAvoidingView
        style={[styles.containerMain]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 16,
              paddingTop: 112
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: "center" }}>
              <Image
                source={Icons.IcApp}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />

              <MaskedView
                style={{
                  width: "100%",
                  height: 38,
                  marginTop: 16,
                }}
                maskElement={<Text style={styles.appTitle}>VNFITE WORK</Text>}
              >
                <LinearGradient
                  colors={COLORS.gradient2}
                  style={{ flex: 1 }}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
              </MaskedView>
            </View>

            <View
              style={{
                marginTop: 40,
                width: Dimensions.get("window").width - 48,
              }}
            >
              <Text style={styles.titleInput}>Tài khoản</Text>
              <TextInput
                placeholder="Nhập tên tài khoản"
                value={username}
                placeholderTextColor={COLORS.text.bland}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                autoCorrect={false}
              />

              <Text style={[styles.titleInput, { marginTop: 18 }]}>
                Mật khẩu
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordRef}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  placeholderTextColor={COLORS.text.bland}
                  onChangeText={setPassword}
                  secureTextEntry={!visible}
                  style={styles.inputPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={{ marginRight: 12 }}
                  onPress={() => setVisible(!visible)}
                >
                  {visible ? (
                    <EyeOff size={24} color={COLORS.text.bland} />
                  ) : (
                    <Eye size={24} color={COLORS.text.bland} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.rememberContainer}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  activeOpacity={0.8}
                  onPress={() => setRemember(!remember)}
                >
                  <Image
                    source={
                      remember ? Icons.CircleCheckTrue : Icons.CircleCheckFalse
                    }
                    style={{ width: 20, height: 20 }}
                  />
                  <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
                activeOpacity={0.7}
                onPress={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.loginText}>Đăng nhập</Text>
                )}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  containerMain: {
    flex: 1,
    alignItems: "center",
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 32,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.dark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.neutral.neutral100,
    fontWeight: "400",
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 17,
    color: COLORS.text.dark,
    marginBottom: 18,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.neutral.neutral100,
    borderRadius: 999,
  },
  inputPassword: {
    paddingHorizontal: 16,
    height: 48,
    fontWeight: "400",
    fontSize: 17,
    color: COLORS.text.dark,
    flex: 1,
  },
  loginButton: {
    marginTop: 28,
    height: 48,
    backgroundColor: COLORS.Primary,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text.bland,
  },
});
