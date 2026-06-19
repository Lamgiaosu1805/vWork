import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const AccordionSection = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={17}
          color="#9CA3AF"
        />
      </TouchableOpacity>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
};

export default AccordionSection;

const styles = StyleSheet.create({
  wrapper: { backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  title: { fontSize: 15, fontWeight: "600", color: "#111827" },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#F3F4F6",
    paddingTop: 4,
  },
});
