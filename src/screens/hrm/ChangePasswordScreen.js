import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import useAuth from "../../hooks/useAuth";
import Header from "../../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { changePassword, loading, error } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const canSubmit = useMemo(
    () => !loading && currentPassword && newPassword && confirmPassword,
    [currentPassword, newPassword, confirmPassword, loading],
  );

  const validate = () => {
    const nextErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    try {
      await changePassword(currentPassword, newPassword);
      if (navigation.canGoBack()) {
        await AsyncStorage.removeItem("lastStack");
        await AsyncStorage.removeItem("accessToken");
        navigation.replace("LoginScreen");
      } else {
        navigation.navigate("HRMBottomTab");
      }
    } catch (changeError) {
      console.log("[ChangePasswordScreen]", changeError);
    }
  };

  const handleInputChange = (setter, fieldName) => (value) => {
    setter(value);
    setFieldErrors((current) => ({ ...current, [fieldName]: undefined }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={"padding"}>
        <Header
          title={"Đổi mật khẩu"}
          leftIconName="chevron-back-outline"
          onLeftPress={() => {
            navigation.goBack();
          }}
        />

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="lock-closed-outline" size={26} color="#fff" />
              </View>

              <Text style={styles.title}>Đổi mật khẩu</Text>
              <Text style={styles.subtitle}>
                Nhập mật khẩu hiện tại và đặt một mật khẩu mới để bảo mật tài
                khoản.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu hiện tại</Text>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.currentPassword && styles.inputRowError,
                ]}
              >
                <Ionicons name="key-outline" size={18} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={currentPassword}
                  onChangeText={handleInputChange(
                    setCurrentPassword,
                    "currentPassword",
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword((value) => !value)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showCurrentPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.currentPassword ? (
                <Text style={styles.errorText}>
                  {fieldErrors.currentPassword}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.newPassword && styles.inputRowError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#6B7280"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={newPassword}
                  onChangeText={handleInputChange(
                    setNewPassword,
                    "newPassword",
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword((value) => !value)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.newPassword ? (
                <Text style={styles.errorText}>{fieldErrors.newPassword}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.confirmPassword && styles.inputRowError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#6B7280"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={confirmPassword}
                  onChangeText={handleInputChange(
                    setConfirmPassword,
                    "confirmPassword",
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((value) => !value)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword ? (
                <Text style={styles.errorText}>
                  {fieldErrors.confirmPassword}
                </Text>
              ) : null}
            </View>

            {error ? <Text style={styles.serverError}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!canSubmit || loading) && styles.submitButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
            >
              <Text style={styles.submitText}>
                {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }

                navigation.navigate("HRMBottomTab");
              }}
            >
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#004643",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  inputRowError: {
    borderColor: "#EF4444",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 10,
  },
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#EF4444",
  },
  serverError: {
    marginBottom: 12,
    fontSize: 13,
    color: "#B91C1C",
  },
  submitButton: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#004643",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  backButton: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#004643",
  },
});
