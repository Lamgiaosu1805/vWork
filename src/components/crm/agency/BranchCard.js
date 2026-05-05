import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatRevenueCompact } from "../../../utils/crmUtils";

const BranchCard = ({ item, onView, onEdit, onDelete }) => (
  <View style={styles.branchCard}>
    <View style={styles.cardHeader}>
      <View style={styles.branchInfo}>
        <View style={styles.branchAvatar}>
          <Text style={styles.avatarText}>{item.code.substring(0, 2)}</Text>
        </View>
        <View style={styles.branchTextContainer}>
          <Text style={styles.branchName}>{item.name}</Text>
          <Text style={styles.branchCode}>{item.code}</Text>
        </View>
      </View>
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor:
              item.status === "active"
                ? "#DCFCE7"
                : item.status === "inactive"
                  ? "#FEE2E2"
                  : "#FEF9C3",
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color:
                item.status === "active"
                  ? "#22C55E"
                  : item.status === "inactive"
                    ? "#ED2E30"
                    : "#EAB308",
            },
          ]}
        >
          {item.status === "active"
            ? "Hoạt động"
            : item.status === "inactive"
              ? "Tạm dừng"
              : "Ngừng"}
        </Text>
      </View>
    </View>

    <View style={styles.cardDivider} />

    <View style={styles.cardBody}>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Địa chỉ</Text>
          <Text style={styles.infoValue}>{item.city}</Text>
          <Text style={styles.infoSubValue}>{item.address}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Doanh thu</Text>
          <Text style={styles.infoValue}>
            {formatRevenueCompact(item.revenue)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Khách hàng</Text>
          <Text style={styles.infoValue}>{item.customers}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Quản lí</Text>
          <Text style={styles.infoValue}>{item.manager}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Ngày tạo</Text>
          <Text style={styles.infoValue}>{item.createdAt}</Text>
        </View>
      </View>
    </View>

    <View style={styles.cardDivider} />

    <View style={styles.cardFooter}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onView(item)}
      >
        <Ionicons name="eye-outline" size={20} color="#2563EB" />
        <Text style={styles.actionButtonText}>Xem</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onEdit(item)}
      >
        <Ionicons name="pencil-outline" size={20} color="#2563EB" />
        <Text style={styles.actionButtonText}>Sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onDelete(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#2563EB" />
        <Text style={styles.actionButtonText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default BranchCard;

const styles = StyleSheet.create({
  branchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  branchInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  branchTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  branchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ED2E30",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  branchName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  branchCode: {
    fontSize: 11,
    fontWeight: "500",
    color: "#374151",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#959595",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  infoSubValue: {
    fontSize: 11,
    fontWeight: "500",
    color: "#959595",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
});
