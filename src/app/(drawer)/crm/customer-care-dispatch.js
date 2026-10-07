import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ChevronLeft, Gauge, Users } from "lucide-react-native";

import Header from "../../../components/Header";
import AppSwitcherPill from "../../../features/crm/components/AppSwitcherPill";
import { CRM_COLORS, CRM_RADIUS } from "../../../features/crm/theme/colors";
import { useAppSwitcher } from "../../../features/crm/context/AppSwitcherContext";
import {
  CARE_SUPPORTED_APP_CODE,
  CareDispatchOverview,
  CareSalesAllocationList,
  useCustomerCarePermissions,
} from "../../../features/crmCustomerCare";

const TABS = [
  { key: "overview", label: "Tổng quan", icon: Gauge },
  { key: "sales", label: "Sale nhận khách", icon: Users },
];

export default function CustomerCareDispatchScreen() {
  const { showCustomerCareMgmt, isLoading } = useCustomerCarePermissions();
  const { appCode, setSelectedApp } = useAppSwitcher();
  const [activeTab, setActiveTab] = useState("overview");

  const header = (
    <Header centerContent={<AppSwitcherPill />} LeftIcon={ChevronLeft} onLeftPress={() => router.back()} />
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        {header}
        <ActivityIndicator style={{ marginTop: 40 }} color={CRM_COLORS.primary} />
      </View>
    );
  }

  if (!showCustomerCareMgmt) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={44} color="#CBD5E0" />
          <Text style={styles.centerText}>Bạn không có quyền truy cập tính năng này</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <Text style={styles.title}>Điều phối khách</Text>

      {appCode !== CARE_SUPPORTED_APP_CODE ? (
        <View style={styles.center}>
          <Ionicons name="information-circle-outline" size={44} color="#CBD5E0" />
          <Text style={styles.centerText}>Phân khách tự động hiện chỉ áp dụng cho TIKLUY.</Text>
          <TouchableOpacity style={styles.switchBtn} onPress={() => setSelectedApp("TIKLUY")} activeOpacity={0.85}>
            <Text style={styles.switchText}>Chuyển sang TIKLUY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.tabRow}>
            {TABS.map((tab) => {
              const active = tab.key === activeTab;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <Icon size={14} color={active ? CRM_COLORS.primary : "#6B7280"} />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === "overview" ? (
            <CareDispatchOverview appCode={appCode} />
          ) : (
            <CareSalesAllocationList appCode={appCode} />
          )}

          <Text style={styles.footNote}>
            Phân / thu hồi khách thủ công và cấu hình chính sách SLA thực hiện trên web vWork.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CRM_COLORS.background },
  title: { fontSize: 18, fontWeight: "900", color: "#111827", paddingHorizontal: 16, marginBottom: 10 },
  tabRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: CRM_RADIUS.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  tabBtnActive: { backgroundColor: "#FFF3EE", borderColor: "#FFE3D5" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
  tabTextActive: { color: CRM_COLORS.primary },
  center: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 32, gap: 12 },
  centerText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  switchBtn: { backgroundColor: CRM_COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: CRM_RADIUS.pill },
  switchText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  footNote: { fontSize: 11, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 24, paddingVertical: 10 },
});
