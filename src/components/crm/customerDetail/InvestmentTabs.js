import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import InvestmentCard from "./InvestmentCard";
import RangeDatePickerModal from "./RangeDatePickerModal";
import { fmtDate } from "../../../utils/crmUtils";

const PRIMARY = "#ED2E30";

const InvestmentTabs = ({
  investment,
  pagination,
  isLoading,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  loadingMore,
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
    <View style={styles.container}>
      <Text style={styles.title}>Hợp đồng đầu tư</Text>

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
        data={investment}
        keyExtractor={(item, index) =>
          item?.id?.toString() || item?.investmentCode || index.toString()
        }
        renderItem={({ item }) => <InvestmentCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>Không có dữ liệu</Text>
        )}
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

export default InvestmentTabs;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  empty: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 30,
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
    marginVertical: 16,
  },
  filterTriggerText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
});
