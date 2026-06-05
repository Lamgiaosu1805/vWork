import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const ActionButtons = ({ item, onApprove, onReject, isReviewing }) => {
  if (item.status !== "pending") return null;

  return (
    <View style={styles.actionRow}>
      <TouchableOpacity
        onPress={() => onApprove(item._id)}
        disabled={isReviewing}
        style={[
          styles.actionBtn,
          styles.approveBtn,
          isReviewing && { opacity: 0.5 },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark" size={18} color={"#047857"} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onReject(item._id)}
        disabled={isReviewing}
        style={[
          styles.actionBtn,
          styles.rejectBtn,
          isReviewing && { opacity: 0.5 },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={18} color={"#BE123C"} />
      </TouchableOpacity>
    </View>
  );
};

export default ActionButtons;

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtn: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  rejectBtn: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1.5,
    borderColor: "#FECDD3",
  },
});
