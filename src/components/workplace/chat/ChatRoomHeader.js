import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ChatRoomHeader = ({ title, avatar, insets, onBack, onPressProfile }) => {
  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color="#111827" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.content} onPress={onPressProfile}>
        {avatar}

        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ChatRoomHeader;

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  center: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
});
