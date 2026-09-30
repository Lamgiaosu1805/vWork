import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { openDrawer } from "../../../helpers/navigationRef";
import { Menu, ChevronLeft } from "lucide-react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";

const ComingSoonScreen = ({ title, subtitle, icon = "construct", showBack }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {showBack ? (
        <View style={[styles.backHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft size={24} color={CRM_COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.backTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
      ) : (
        <Header title={title} LeftIcon={Menu} onLeftPress={() => openDrawer()} />
      )}

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={40} color={CRM_COLORS.primary} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.heading}>Tính năng đang phát triển</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerBrand}>VNFITE - Customer Relationship Management</Text>
      </View>
    </View>
  );
};

export default ComingSoonScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CRM_COLORS.background },
  backHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: CRM_COLORS.white,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backTitle: { fontSize: 17, fontWeight: "700", color: CRM_COLORS.textDark },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: CRM_RADIUS.pill,
    backgroundColor: "#FFF3EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CRM_COLORS.success,
    borderWidth: 2,
    borderColor: CRM_COLORS.white,
  },
  heading: { fontSize: 18, fontWeight: "800", color: CRM_COLORS.textDark, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 13, color: CRM_COLORS.textMuted, textAlign: "center", lineHeight: 19 },
  footer: { paddingVertical: 20, alignItems: "center" },
  footerBrand: { fontSize: 11, color: CRM_COLORS.textFaint },
});
