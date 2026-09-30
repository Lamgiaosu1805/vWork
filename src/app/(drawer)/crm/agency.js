import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import Header from "../../../components/Header";
import { Skeleton } from "../../../components/Skeleton";
import { CRM_COLORS, CRM_RADIUS } from "../../../features/crm/theme/colors";
import useAgentsList from "../../../features/crmAgency/hooks/useAgentsList";
import { useMyPermissions, CRM_AGENT_PERMISSIONS } from "../../../features/permission";

const getAgentTypeName = (type) => (type === "ENTERPRISE" ? "Doanh nghiệp" : "Cá nhân");

const AgentCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Skeleton width={90} height={22} borderRadius={6} />
      <Skeleton width={70} height={20} borderRadius={12} />
    </View>
    <Skeleton width="55%" height={16} style={{ marginBottom: 6 }} />
    <Skeleton width="35%" height={12} />
    <View style={styles.divider} />
    <Skeleton width="70%" height={12} style={{ marginBottom: 10 }} />
    <Skeleton width="80%" height={12} style={{ marginBottom: 10 }} />
    <Skeleton width="60%" height={12} />
  </View>
);

export default function AgencyScreen() {
  const [selected, setSelected] = useState(null);
  const { canAny, isLoading: permissionsLoading } = useMyPermissions();
  const hasAccess = canAny(CRM_AGENT_PERMISSIONS);
  const query = useAgentsList({}, !permissionsLoading && hasAccess);
  const agents = useMemo(() => query.data?.pages?.flatMap((p) => p.items) ?? [], [query.data]);

  if (!permissionsLoading && !hasAccess) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <Header title="Danh sách đại lý" LeftIcon={ChevronLeft} onLeftPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>Bạn không có quyền truy cập tính năng này</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setSelected(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.agentTypeContainer}>
          <Ionicons name={item.agent_type === "ENTERPRISE" ? "business" : "person"} size={16} color={CRM_COLORS.accent} />
          <Text style={styles.agentType}>{getAgentTypeName(item.agent_type)}</Text>
        </View>
        <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, item.is_active ? styles.textActive : styles.textInactive]}>{item.is_active ? "Hoạt động" : "Đã khóa"}</Text>
        </View>
      </View>

      <Text style={styles.agentName}>{item.full_name}</Text>
      <Text style={styles.agentCode}>Mã ĐL: {item.agent_code}</Text>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={16} color="#718096" />
        <Text style={styles.infoText}>{item.phone_number}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={16} color="#718096" />
        <Text style={styles.infoText}>{item.email}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color="#718096" />
        <Text style={styles.infoText} numberOfLines={1}>{item.address} - {item.branch_name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <Header title="Danh sách đại lý" LeftIcon={ChevronLeft} onLeftPress={() => router.back()} />

      {(permissionsLoading || (query.isLoading && agents.length === 0)) ? (
        <View style={styles.listContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={agents}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#CBD5E0" />
              <Text style={styles.emptyText}>Chưa có dữ liệu đại lý</Text>
            </View>
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 20 }} color={CRM_COLORS.accent} /> : null}
        />
      )}

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetName}>{selected?.full_name}</Text>
            <Text style={styles.sheetCode}>Mã ĐL: {selected?.agent_code} · {getAgentTypeName(selected?.agent_type)}</Text>

            <View style={styles.sheetDetailBox}>
              <View style={styles.sheetRow}>
                <Ionicons name="call-outline" size={16} color="#718096" />
                <Text style={styles.sheetRowText}>{selected?.phone_number}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.sheetRow}>
                <Ionicons name="mail-outline" size={16} color="#718096" />
                <Text style={styles.sheetRowText}>{selected?.email}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.sheetRow}>
                <Ionicons name="location-outline" size={16} color="#718096" />
                <Text style={styles.sheetRowText}>{selected?.address} - {selected?.branch_name}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)} activeOpacity={0.85}>
              <Text style={styles.closeBtnText}>Đóng</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CRM_COLORS.background },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: "#FFFFFF", borderRadius: CRM_RADIUS.md, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  agentTypeContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF3FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  agentType: { fontSize: 12, color: CRM_COLORS.accent, fontWeight: "600", marginLeft: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: "#E6FFFA" },
  statusInactive: { backgroundColor: "#FFF5F5" },
  statusText: { fontSize: 12, fontWeight: "600" },
  textActive: { color: "#319795" },
  textInactive: { color: "#E53E3E" },
  agentName: { fontSize: 16, fontWeight: "700", color: "#2D3748", marginBottom: 4 },
  agentCode: { fontSize: 13, color: "#718096", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { fontSize: 14, color: "#4A5568", marginLeft: 8, flex: 1 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: 15, color: "#A0AEC0" },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  sheetHandle: { width: 40, height: 5, backgroundColor: "#CBD5E0", borderRadius: 3, alignSelf: "center", marginBottom: 16 },
  sheetName: { fontSize: 18, fontWeight: "800", color: "#111827", textAlign: "center" },
  sheetCode: { fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 4, marginBottom: 16 },
  sheetDetailBox: { backgroundColor: "#F9FAFB", borderRadius: CRM_RADIUS.sm, padding: 14, borderWidth: 1, borderColor: "#E5E7EB" },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  sheetRowText: { fontSize: 14, color: "#374151", flex: 1 },
  closeBtn: { marginTop: 20, backgroundColor: CRM_COLORS.primary, borderRadius: CRM_RADIUS.pill, paddingVertical: 14, alignItems: "center" },
  closeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
