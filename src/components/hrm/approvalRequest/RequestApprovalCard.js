import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import ActionButtons from "./ActionButtons";
import { STATUS_MAP } from "../../../constants/hrm";
import { getRequestTypeLabel, getTimeLabel } from "../../../helpers/request";
import { AuthAvatar } from "../../PostCard";

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const RequestApprovalCard = ({ item, onApprove, onReject, isReviewing }) => {
  const [avatarModal, setAvatarModal] = useState(false);
  const avatarUri = item.user_id?.avatar || null;

  return (
    <View style={styles.requestCard}>
      <View style={styles.cardTopRow}>
        <AuthAvatar
          size={42}
          filename={avatarUri}
          name={item.user_id?.full_name}
          onPress={() => avatarUri && setAvatarModal(true)}
        />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.employeeName} numberOfLines={1}>
            {item.user_id?.full_name || "--"}
          </Text>
          <Text style={styles.employeeCode}>{item.user_id?.ma_nv || "--"}</Text>
        </View>

        <StatusBadge status={item.status} />
      </View>

      <View style={styles.infoRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={styles.infoIconBox}>
            <Ionicons
              name="document-text-outline"
              size={14}
              color={"#2563EB"}
            />
          </View>
          <Text style={styles.infoLabel}>Loại đơn</Text>
        </View>
        <Text style={styles.infoValue}>{getRequestTypeLabel(item)}</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={styles.infoIconBox}>
            <Ionicons name="calendar-outline" size={14} color={"#2563EB"} />
          </View>
          <Text style={styles.infoLabel}>Thời gian</Text>
        </View>
        <Text style={styles.infoValue}>{getTimeLabel(item)}</Text>
      </View>

      <View style={[styles.infoRow]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={[styles.infoIconBox]}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color={"#2563EB"}
            />
          </View>
          <Text style={styles.infoLabel}>Lý do</Text>
        </View>
        <Text style={[styles.infoValue]}>{item.reason || "--"}</Text>
      </View>

      {item.status === "pending" && (
        <View style={styles.cardFooter}>
          <ActionButtons
            item={item}
            onApprove={onApprove}
            onReject={onReject}
            isReviewing={isReviewing}
          />
        </View>
      )}

      {avatarUri && (
        <Modal
          visible={avatarModal}
          transparent
          animationType="fade"
          onRequestClose={() => setAvatarModal(false)}
        >
          <Pressable
            style={styles.avatarModalOverlay}
            onPress={() => setAvatarModal(false)}
          >
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarModalImage}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

export default RequestApprovalCard;

const styles = StyleSheet.create({
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  employeeName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  employeeCode: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(37,99,235,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  infoValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    flexWrap: "wrap",
    flex: 1,
  },

  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-end",
  },

  avatarModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarModalImage: { width: "90%", height: "70%", borderRadius: 16 },
});
