import React from "react";
import {
    DrawerContentScrollView,
    DrawerItem,
} from "@react-navigation/drawer";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CustomDrawerContent(props) {
    const { navigation, state } = props;

    const currentRoute = state?.routeNames[state?.index];

    const handleNavigate = async (routeName) => {
        navigation.navigate(routeName);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem("lastStack");
        await AsyncStorage.removeItem("accessToken");
        navigation.replace("LoginScreen");
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

                    if (routeName === 'Settings') {
                        const parent = navigation.getParent ? navigation.getParent() : null;
                        if (parent && parent.navigate) {
                            parent.navigate('Settings');
                        } else {
                            navigation.navigate('Settings');
                        }
                        return;
                    }

                    navigation.navigate(routeName);
                }}
            >
                <Ionicons
                    name={icon}
                    size={22}
                    color={"#555"}
                    style={{ marginRight: 10 }}
                />
                <Text style={styles.menuLabel}>
                    {label}
                </Text>
            </TouchableOpacity>
        )
    }

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
            {/* Header profile */}
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: "https://thuvienvector.vn/wp-content/uploads/2025/04/logo-co-dang-vector.jpg" }}
                    style={styles.avatar}
                />
                <Text style={styles.username}>Nghiêm Khắc Lâm</Text>
                <Text style={styles.subInfo}>Tạp vụ - VNF1999</Text>
                <Text style={styles.subInfo}>Khối Công nghệ</Text>
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

                <DrawerItemCustom
                    label="CRM"
                    icon="cart-outline"
                    routeName="CRMStackNavigator"
                />
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
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 10,
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
