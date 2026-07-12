import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";

const PRIMARY = "#ED2E30";

const TABS = [
  { key: "info", label: "Thông tin" },
  { key: "transaction", label: "Biến động" },
  { key: "investment", label: "Đầu tư" },
  { key: "care", label: "Chăm sóc" },
];

export default function CustomerTabs({ activeTab, onTabChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.wrap}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={active ? styles.activeTab : styles.tab}
            onPress={() => onTabChange(tab.key)}
          >
            <Text style={active ? styles.activeText : styles.text}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, gap: 10, marginBottom: 8 },
  activeTab: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  activeText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  tab: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  text: { color: "#6B7280", fontWeight: "600", fontSize: 13 },
});
