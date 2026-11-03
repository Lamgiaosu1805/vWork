import { FlatList, RefreshControl } from "react-native";
import React, { useMemo } from "react";
import { useIsFocused } from "@react-navigation/native";
import { CRM_COLORS } from "../../crm/theme/colors";
import useServerNow from "../hooks/useServerNow";
import { sortQueueByUrgency } from "../lib/sla";
import CareQueueCard from "./CareQueueCard";

/** Danh sách hàng đợi có đồng hồ tick mỗi giây — tách riêng để màn cha không render lại theo giây. */
const CareQueueList = ({
  items,
  serverOffsetMs,
  dataUpdatedAt,
  refreshing,
  onRefresh,
  onPressItem,
  onCall,
  onReport,
  ListHeaderComponent,
  ListEmptyComponent,
}) => {
  const isFocused = useIsFocused();
  const now = useServerNow(serverOffsetMs, isFocused);

  // Chỉ sắp lại khi có dữ liệu mới (30s/lần) để thẻ không nhảy vị trí theo từng giây
  const sorted = useMemo(
    () => sortQueueByUrgency(items, Date.now() + serverOffsetMs),
    [items, serverOffsetMs, dataUpdatedAt],
  );

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item._id}
      extraData={now}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CRM_COLORS.primary]} tintColor={CRM_COLORS.primary} />
      }
      renderItem={({ item }) => (
        <CareQueueCard
          item={item}
          now={now}
          onPress={() => onPressItem(item)}
          onCall={() => onCall(item)}
          onReport={() => onReport(item)}
        />
      )}
    />
  );
};

export default CareQueueList;
