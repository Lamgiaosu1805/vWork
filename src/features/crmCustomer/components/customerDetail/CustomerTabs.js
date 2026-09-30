import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../../crm/theme/colors";

const TABS = [
  { key: "info", label: "Thông tin" },
  { key: "transaction", label: "Biến động" },
  { key: "investment", label: "Đầu tư" },
  { key: "care", label: "Chăm sóc" },
];

export default function CustomerTabs({ activeTab, onTabChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={active ? styles.activeTab : styles.tab} onPress={() => onTabChange(tab.key)}>
            <Text style={active ? styles.activeText : styles.text}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, gap: 10, marginBottom: 8 },
  activeTab: { backgroundColor: CRM_COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: CRM_RADIUS.pill },
  activeText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  tab: { backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: CRM_RADIUS.pill },
  text: { color: "#6B7280", fontWeight: "600", fontSize: 13 },
});
