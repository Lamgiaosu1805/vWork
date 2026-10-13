import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useRef } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Menu, Network } from "lucide-react-native";

import Header from "../../../../components/Header";
import { Skeleton } from "../../../../components/Skeleton";
import { openDrawer } from "../../../../helpers/navigationRef";
import { CRM_COLORS, CRM_RADIUS } from "../../../../features/crm/theme/colors";
import {
  CareCallController,
  CareQueueList,
  CareSummaryCards,
  openCareReport,
  useCustomerCarePermissions,
  useMyCareQueue,
} from "../../../../features/crmCustomerCare";

const QueueSkeleton = () => (
  <View style={{ paddingHorizontal: 16, gap: 12 }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} width="100%" height={170} borderRadius={CRM_RADIUS.lg} />
    ))}
  </View>
);

const CenterMessage = ({ icon, text, actionLabel, onAction }) => (
  <View style={styles.center}>
    <Ionicons name={icon} size={44} color="#CBD5E0" />
    <Text style={styles.centerText}>{text}</Text>
    {!!actionLabel && (
      <TouchableOpacity style={styles.centerBtn} onPress={onAction} activeOpacity={0.85}>
        <Text style={styles.centerBtnText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const goToDispatch = () => router.push("/crm/customer-care-dispatch");

export default function CustomerCareQueueScreen() {
  const { showCustomerCareQueue, showCustomerCareMgmt, isLoading: permissionsLoading } = useCustomerCarePermissions();
  const queueQuery = useMyCareQueue({ enabled: showCustomerCareQueue });
  const callRef = useRef(null);

  const data = queueQuery.data;
  const items = data?.items ?? [];

  const openDetail = (item) => {
    const customer = item.customer_id;
    if (!customer?.external_id) return;
    router.push({
      pathname: "/crm/customer-detail",
      params: { externalId: customer.external_id, customerId: customer._id, tab: "care" },
    });
  };

  const header = (
    <Header
      title="Khách cần xử lý"
      LeftIcon={Menu}
      onLeftPress={() => openDrawer()}
      RightIcon={showCustomerCareMgmt ? Network : null}
      onRightPress={showCustomerCareMgmt ? goToDispatch : undefined}
    />
  );

  if (permissionsLoading) {
    return (
      <View style={styles.root}>
        {header}
        <ActivityIndicator style={{ marginTop: 40 }} color={CRM_COLORS.primary} />
      </View>
    );
  }

  if (!showCustomerCareQueue) {
    return (
      <View style={styles.root}>
        {header}
        <CenterMessage
          icon="lock-closed-outline"
          text="Bạn không có quyền xem danh sách khách cần xử lý"
          actionLabel={showCustomerCareMgmt ? "Mở Điều phối khách" : null}
          onAction={goToDispatch}
        />
      </View>
    );
  }

  const renderEmpty = () => {
    if (queueQuery.isLoading) return <QueueSkeleton />;
    if (queueQuery.isError) {
      return (
        <CenterMessage
          icon="cloud-offline-outline"
          text={queueQuery.error?.response?.data?.message || "Không tải được danh sách khách cần xử lý"}
          actionLabel="Thử lại"
          onAction={() => queueQuery.refetch()}
        />
      );
    }
    return <CenterMessage icon="checkmark-done-circle-outline" text="Hiện chưa có khách nào được giao cho bạn" />;
  };

  return (
    <View style={styles.root}>
      {header}

      <CareQueueList
        items={items}
        serverOffsetMs={data?.serverOffsetMs ?? 0}
        dataUpdatedAt={queueQuery.dataUpdatedAt}
        refreshing={queueQuery.isRefetching && !queueQuery.isLoading}
        onRefresh={() => queueQuery.refetch()}
        onPressItem={openDetail}
        onCall={(item) => callRef.current?.call(item.customer_id)}
        onReport={(item) => openCareReport({ customer: item.customer_id, source: "manual" })}
        ListHeaderComponent={
          <View style={{ paddingTop: 4 }}>
            <CareSummaryCards summary={data?.summary} />
            {items.length > 0 && (
              <Text style={styles.sectionHint}>Sắp theo độ gấp — gọi khách nóng (nhóm A) trong 5 phút.</Text>
            )}
          </View>
        }
        ListEmptyComponent={renderEmpty}
      />

      <CareCallController ref={callRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CRM_COLORS.background },
  sectionHint: { fontSize: 12, color: "#6B7280", paddingHorizontal: 16, marginBottom: 10 },
  center: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 32, gap: 12 },
  centerText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  centerBtn: { marginTop: 4, backgroundColor: CRM_COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: CRM_RADIUS.pill },
  centerBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
