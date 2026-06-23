import React, { useEffect, useState } from "react";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useSelector } from "react-redux";
import api from "../api/axiosInstance";
import { unregisterFcmTokenFromServer } from "../utils/notifications/fcmConfig";
import { getPermissions } from "../helpers/permissions";
import { disconnectChatSocket } from "../libs/chatSocket";
import utils from "../helpers/utils";

export default function CustomDrawerContent(props) {
  const { navigation, state } = props;
  const user = useSelector((state) => state.auth.user);
  const { showCRM } = getPermissions(user);

  const [avatarBase64, setAvatarBase64] = useState(null);
  const [uploading, setUploading] = useState(false);

  const currentRoute = state?.routeNames[state?.index];

  // Fetch ảnh avatar kèm token
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.avatar) return;

      const url = `${utils.BASE_URL}/static/${user.avatar}`;

      // try {
      //   const res = await api.get(`/document/getFile?filename=${user.avatar}`, {
      //     requiresAuth: true,
      //     responseType: "blob",
      //   });

      //   // Convert blob → base64
      //   const reader = new FileReader();
      //   reader.onloadend = () => {
      //     setAvatarBase64(reader.result);
      //   };
      //   reader.readAsDataURL(res.data);
      // } catch (error) {
      //   console.log("fetchAvatar error:", error.message);
      // }

      setAvatarBase64(url);
    };

    fetchAvatar();
  }, [user?.avatar, user?.updatedAt]);

  const handlePickAvatar = async () => {
    // Xin quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần cấp quyền truy cập ảnh",
        "Vui lòng cấp quyền truy cập thư viện ảnh trong phần Cài đặt để thay đổi avatar.",
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Mở Cài đặt",
            onPress: () => Linking.openSettings(),
          },
        ],
      );
      return;
    }

    // Mở thư viện ảnh + crop vuông ngay trong picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // bật crop
      aspect: [1, 1], // crop vuông
      quality: 0.8,
    });

    if (result.canceled) return;

    const selectedUri = result.assets[0].uri;

    try {
      setUploading(true);

      // Resize về 400x400 trước khi upload
      const manipulated = await ImageManipulator.manipulateAsync(
        selectedUri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      // Tạo FormData upload lên server
      const formData = new FormData();
      formData.append("avatar", {
        uri: manipulated.uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      });

      await api.post("/user/uploadAvatar", formData, {
        requiresAuth: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Hiển thị ảnh mới ngay, không cần fetch lại
      setAvatarBase64(manipulated.uri);
    } catch (error) {
      console.log("uploadAvatar error:", error.message);
      alert("Upload avatar thất bại, vui lòng thử lại");
    } finally {
      setUploading(false);
    }
  };

  const handleNavigate = async (routeName) => {
    navigation.navigate(routeName);
  };

  const handleLogout = async () => {
    await unregisterFcmTokenFromServer();
    await AsyncStorage.removeItem("lastStack");
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    disconnectChatSocket();
    navigation.replace("LoginScreen");
  };

  const handleChangePassword = async () => {
    navigation.closeDrawer?.();
    navigation.navigate("HRMStackNavigator", {
      screen: "ChangePasswordScreen",
    });
  };

  const DrawerItemCustom = ({ label, icon, routeName }) => {
    const isActive = currentRoute === routeName;
    return (
      <TouchableOpacity
        style={[styles.menuItem, isActive && styles.menuItemActive]}
        activeOpacity={0.8}
        onPress={() => handleNavigate(routeName)}
      >
        <Ionicons
          name={icon}
          size={22}
          color={isActive ? "#004643" : "#555"}
          style={{ marginRight: 10 }}
        />
        <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const OtherFeature = ({ label, icon, routeName }) => {
    return (
      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.8}
        onPress={() => {
          if (!routeName) return;
          if (routeName === "Settings") {
            const parent = navigation.getParent ? navigation.getParent() : null;
            if (parent && parent.navigate) {
              parent.navigate("Settings");
            } else {
              navigation.navigate("Settings");
            }
            return;
          }
          // navigation.navigate(routeName);
          Alert.alert(
            label,
            "Tính năng đang được phát triển",
            [{ text: "OK" }],
            { cancelable: true },
          );
        }}
      >
        <Ionicons
          name={icon}
          size={22}
          color={"#555"}
          style={{ marginRight: 10 }}
        />
        <Text style={styles.menuLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Header profile */}
      <View style={styles.profileContainer}>
        {/* Avatar + nút chỉnh sửa */}
        <TouchableOpacity
          onPress={handlePickAvatar}
          disabled={uploading}
          style={styles.avatarWrapper}
          activeOpacity={0.8}
        >
          {user?.avatar ? (
            <Image source={{ uri: avatarBase64 }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={36} color="#aaa" />
            </View>
          )}

          {/* Overlay loading khi đang upload */}
          {uploading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}

          {/* Icon camera góc dưới phải */}
          {!uploading && (
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.username}>{user?.full_name}</Text>
        <Text style={styles.subInfo}>MNV: {user?.ma_nv}</Text>
        <Text style={styles.subInfo}>
          {user?.departments[0]?.position?.position_name} -{" "}
          {user?.departments[0]?.department?.department_name}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Menu items */}
      <View style={{ paddingHorizontal: 12 }}>
        <DrawerItemCustom
          label="WORKPLACE"
          icon="business-outline"
          routeName="WorkPlaceStackNavigator"
        />
        <DrawerItemCustom
          label="HRM"
          icon="people-outline"
          routeName="HRMStackNavigator"
        />
        {showCRM && (
          <DrawerItemCustom
            label="CRM"
            icon="cart-outline"
            routeName="CRMStackNavigator"
          />
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.featureGroup}>
        <Text style={styles.featureGroupTitle}>Tiện ích</Text>
        <View style={styles.featureGroupItems}>
          <OtherFeature
            label="Cài đặt"
            icon="settings-outline"
            routeName="Settings"
          />
          <OtherFeature
            label="VNF-Assistant"
            icon="chatbubbles-outline"
            routeName="VNFAssistantScreen"
          />
          <OtherFeature
            label="Về chúng tôi"
            icon="information-circle-outline"
            routeName="AboutScreen"
          />
        </View>
      </View>

      {/* Footer logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.changePassBtn}
          onPress={handleChangePassword}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#E63946" />
          <Text style={styles.changePassText}>Đổi mật khẩu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    padding: 20,
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#004643",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
  },
  subInfo: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: "#E8F5F2",
  },
  menuLabel: {
    fontSize: 15,
    color: "#333",
  },
  menuLabelActive: {
    fontWeight: "600",
    color: "#004643",
  },
  footer: {
    marginTop: "auto",
    padding: 20,
    gap: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#E63946",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    marginLeft: 6,
  },
  changePassBtn: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E63946",
  },
  changePassText: {
    color: "#E63946",
    fontSize: 15,
    marginLeft: 6,
  },
  featureGroup: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  featureGroupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    marginLeft: 4,
  },
  featureGroupItems: {
    backgroundColor: "#F8FAFB",
    borderRadius: 12,
    paddingVertical: 4,
  },
});
