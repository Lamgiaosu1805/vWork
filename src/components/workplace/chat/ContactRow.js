import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { AuthAvatar } from "../../PostCard";
import { Ionicons } from "@expo/vector-icons";

const ContactRow = ({ item, onPress, selected = false, groupMode }) => {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={() => onPress?.(item)}>
      <View style={styles.avatarWrap}>
        {item.avatar ? (
          <AuthAvatar
            filename={item.avatar}
            name={item.full_name}
            size={44}
            cacheKey={item.updatedAt}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.contactName}>{item.full_name}</Text>
      <View style={styles.rightIcon}>
        {groupMode ? (
          selected ? (
            <View style={styles.selectedCircle}>
              <Ionicons name="checkmark-outline" size={14} color="#fff" />
            </View>
          ) : (
            <Ionicons name="ellipse-outline" size={20} color="#D1D5DB" />
          )
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ContactRow;

const styles = StyleSheet.create({
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatarWrap: { width: 44, height: 44, marginRight: 12, position: "relative" },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  contactName: { fontSize: 16, color: "#111827" },
  rightIcon: { marginLeft: "auto" },
  selectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },
});
