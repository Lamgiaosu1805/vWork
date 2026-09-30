import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { Users, History } from "lucide-react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import CustomerCallListTab from "./CustomerCallListTab";
import CallHistoryTab from "./CallHistoryTab";

const CustomerCallWorklistScreen = () => {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <View style={styles.root}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "list" && styles.tabBtnActive]}
          onPress={() => setActiveTab("list")}
          activeOpacity={0.8}
        >
          <Users size={14} color={activeTab === "list" ? CRM_COLORS.primary : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>Danh sách khách hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "history" && styles.tabBtnActive]}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.8}
        >
          <History size={14} color={activeTab === "history" ? CRM_COLORS.primary : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>Lịch sử cuộc gọi</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "list" ? <CustomerCallListTab /> : <CallHistoryTab />}
    </View>
  );
};

export default CustomerCallWorklistScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16, marginTop: 12 },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: CRM_RADIUS.pill,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabBtnActive: { backgroundColor: "#FFF3EE", borderColor: "#FFE3D5" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#6B7280", textAlign: "center" },
  tabTextActive: { color: CRM_COLORS.primary },
});
