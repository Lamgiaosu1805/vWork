import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TICKET_STATUS_CONFIG, TICKET_URGENCY_CONFIG } from "../constants";
import { avatarColorOf, initialsOf } from "../lib/ticketFormat";

const FALLBACK = { bg: "#F3F4F6", color: "#4B5563" };

export const Pill = ({ label, bg = FALLBACK.bg, color = FALLBACK.color }) => (
  <View style={[styles.pill, { backgroundColor: bg }]}>
    <Text style={[styles.pillText, { color }]} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

export const StatusPill = ({ status }) => {
  const cfg = TICKET_STATUS_CONFIG[status] ?? { label: status, ...FALLBACK };
  return <Pill {...cfg} />;
};

export const UrgencyPill = ({ urgency }) => {
  const cfg = TICKET_URGENCY_CONFIG[urgency] ?? { label: urgency, ...FALLBACK };
  return <Pill {...cfg} />;
};

export const Tag = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

// Chưa có người (ticket chưa ai nhận) thì hiện vòng nét đứt với dấu "?"
export const Avatar = ({ id, name, size = 28, bordered = false, style }) => {
  const empty = !name;
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        empty ? styles.avatarEmpty : { backgroundColor: avatarColorOf(id ?? name) },
        bordered && styles.avatarBordered,
        style,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }, empty && { color: "#6B7280" }]}>
        {empty ? "?" : initialsOf(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 11, fontWeight: "700" },
  tag: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: "100%",
  },
  tagText: { fontSize: 11, fontWeight: "600", color: "#4B5563" },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarEmpty: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#9CA3AF",
  },
  avatarBordered: { borderWidth: 2, borderColor: "#FFFFFF" },
  avatarText: { color: "#FFFFFF", fontWeight: "700" },
});
