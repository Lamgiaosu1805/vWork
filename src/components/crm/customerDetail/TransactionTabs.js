import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import RangeDatePickerModal from "./RangeDatePickerModal";
import { fmtDate, formatMoney } from "../../../utils/crmUtils";

const PRIMARY = "#ED2E30";

const TransactionTabs = ({
  transactions,
  pagination,
  loadingMore,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleConfirm = (from, to) => {
    setFromDate(from);
    setToDate(to);
  };

  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
  };

  const hasMore = pagination.page < pagination.total_pages;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Biến động số dư</Text>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.filterTrigger}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="calendar-outline" size={15} color={PRIMARY} />
        <Text
          style={[
            styles.filterTriggerText,
            !(fromDate || toDate) && { color: "#9CA3AF" },
          ]}
        >
          {fromDate || toDate
            ? `${fmtDate(fromDate) || "..."} → ${fmtDate(toDate) || "..."}`
            : "Lọc theo khoảng ngày"}
        </Text>
        {fromDate || toDate ? (
          <TouchableOpacity
            onPress={clearFilter}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={15} color="#9CA3AF" />
        )}
      </TouchableOpacity>

      <FlatList
        scrollEnabled={false}
        data={transactions}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionContent}>{item.content}</Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                <Text style={styles.transactionTime}>{item.createdDate}</Text>
              </View>
            </View>

            <View
              style={[
                styles.amountBadge,
                { backgroundColor: item.plus ? "#DCFCE7" : "#FEE2E2" },
              ]}
            >
              <Text
                style={[
                  styles.transactionAmount,
                  { color: item.plus ? "#16A34A" : "#DC2626" },
                ]}
              >
                {item.plus ? "+" : "-"}
                {formatMoney(item.fluctuatedAmount)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Không có dữ liệu giao dịch</Text>
        )}
        ListFooterComponent={() => {
          if (loadingMore) {
            return (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={PRIMARY} />
              </View>
            );
          }

          if (!hasMore && transactions?.length > 0) {
            return <Text style={styles.endText}>Đã hiển thị tất cả</Text>;
          }

          return null;
        }}
      />

      <RangeDatePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={handleConfirm}
        initialFrom={fromDate}
        initialTo={toDate}
      />
    </View>
  );
};

export default TransactionTabs;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  filterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
  },
  filterTriggerText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  transactionContent: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
    lineHeight: 19,
  },
  transactionTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  amountBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
  endText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    paddingVertical: 14,
  },
});
