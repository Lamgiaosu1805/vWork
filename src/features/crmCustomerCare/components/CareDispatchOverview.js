import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import useCareDashboard from "../hooks/useCareDashboard";

const RANGE_OPTIONS = [
  { value: 1, label: "Hôm nay" },
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
];

const pct = (rate) => (rate == null ? "--" : `${Math.round(rate * 100)}%`);

const Metric = ({ label, value, color = "#111827", bg = "#fff" }) => (
  <View style={[styles.metric, { backgroundColor: bg }]}>
    <Text style={[styles.metricValue, { color }]}>{value ?? 0}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const CareDispatchOverview = ({ appCode }) => {
  const [rangeDays, setRangeDays] = useState(7);
  const todayKey = dayjs().format("YYYY-MM-DD");
  // Chỉ tính lại mốc khi đổi khoảng/ngày để queryKey ổn định giữa các lần render
  const params = useMemo(() => {
    const to = dayjs();
    const from = rangeDays === 1 ? to.startOf("day") : to.subtract(rangeDays, "day");
    return { appCode, from: from.startOf("minute").toISOString(), to: to.endOf("day").toISOString() };
  }, [appCode, rangeDays, todayKey]);

  const query = useCareDashboard(params);
  const data = query.data;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} colors={[CRM_COLORS.primary]} />}
    >
      <View style={styles.rangeRow}>
        {RANGE_OPTIONS.map((opt) => {
          const active = opt.value === rangeDays;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.rangeChip, active && styles.rangeChipActive]}
              onPress={() => setRangeDays(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={CRM_COLORS.primary} style={{ marginTop: 40 }} />
      ) : query.isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color="#CBD5E0" />
          <Text style={styles.centerText}>{query.error?.response?.data?.message || "Không tải được tổng quan"}</Text>
          <TouchableOpacity onPress={() => query.refetch()}>
            <Text style={styles.retry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>Chưa có dữ liệu</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Hiện tại</Text>
          <View style={styles.grid}>
            <Metric label="Đang xử lý" value={data.current?.active} />
            <Metric label="Chưa liên hệ" value={data.current?.not_contacted} color="#1D4ED8" bg="#EFF6FF" />
            <Metric label="Quá hạn liên hệ" value={data.current?.overdue_first_contact} color="#B91C1C" bg="#FEF2F2" />
          </View>
          {!!data.pool && (
            <View style={styles.grid}>
              <Metric label="Kho chung nhóm A" value={data.pool.in_pool?.A} color="#DC2626" />
              <Metric label="Kho chung nhóm B" value={data.pool.in_pool?.B} color="#D97706" />
              <Metric label="CSKH nuôi dưỡng" value={data.pool.nurturing} />
            </View>
          )}

          <Text style={styles.sectionTitle}>Trong kỳ</Text>
          <View style={styles.grid}>
            <Metric label="Đã giao" value={data.period?.assigned} />
            <Metric label="Đã liên hệ" value={data.period?.contacted} />
            <Metric label="Liên hệ đúng hạn" value={pct(data.period?.on_time_rate)} color="#047857" bg="#ECFDF5" />
          </View>
          <View style={styles.grid}>
            <Metric label="Bị thu hồi" value={data.period?.revoked} color="#B91C1C" />
            <Metric label="Chuyển đổi" value={data.period?.converted} color="#047857" />
            <Metric label="Tỷ lệ chuyển đổi" value={pct(data.period?.conversion_rate)} />
          </View>

          <Text style={styles.sectionTitle}>Theo Sale</Text>
          {(data.by_sale ?? []).length === 0 ? (
            <Text style={styles.centerText}>Chưa có Sale nào được giao khách trong kỳ</Text>
          ) : (
            data.by_sale.map((row) => (
              <View key={String(row.sale_id)} style={styles.saleCard}>
                <View style={styles.saleHeader}>
                  <Text style={styles.saleName} numberOfLines={1}>
                    {row.sale?.full_name || "--"}
                    {row.sale?.ma_nv ? <Text style={styles.saleCode}>  {row.sale.ma_nv}</Text> : null}
                  </Text>
                  {row.overdue_now > 0 && (
                    <View style={styles.overdueBadge}>
                      <Text style={styles.overdueText}>{row.overdue_now} quá hạn</Text>
                    </View>
                  )}
                </View>
                <View style={styles.saleStats}>
                  <Text style={styles.saleStat}>Đang giữ: <Text style={styles.bold}>{row.active ?? 0}</Text></Text>
                  <Text style={styles.saleStat}>Giao hôm nay: <Text style={styles.bold}>{row.assigned_today ?? 0}</Text></Text>
                  <Text style={styles.saleStat}>Giao trong kỳ: <Text style={styles.bold}>{row.assigned_in_period ?? 0}</Text></Text>
                  <Text style={styles.saleStat}>Đúng hạn: <Text style={styles.bold}>{pct(row.on_time_rate)}</Text></Text>
                  <Text style={styles.saleStat}>Thu hồi: <Text style={styles.bold}>{row.revoked ?? 0}</Text></Text>
                  <Text style={styles.saleStat}>Chuyển đổi: <Text style={styles.bold}>{row.converted ?? 0}</Text></Text>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
};

export default CareDispatchOverview;

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  rangeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: CRM_RADIUS.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  rangeChipActive: { backgroundColor: "#FFF3EE", borderColor: CRM_COLORS.primary },
  rangeText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  rangeTextActive: { color: CRM_COLORS.primary },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#111827", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 },
  grid: { flexDirection: "row", gap: 8, marginBottom: 8 },
  metric: { flex: 1, borderRadius: CRM_RADIUS.md, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center", borderWidth: 1, borderColor: "#F3F4F6" },
  metricValue: { fontSize: 18, fontWeight: "900" },
  metricLabel: { fontSize: 10, fontWeight: "700", color: "#6B7280", marginTop: 2, textAlign: "center" },
  saleCard: { backgroundColor: "#fff", borderRadius: CRM_RADIUS.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#F3F4F6" },
  saleHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  saleName: { flex: 1, fontSize: 14, fontWeight: "800", color: "#111827" },
  saleCode: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  overdueBadge: { backgroundColor: "#FEF2F2", paddingHorizontal: 8, paddingVertical: 2, borderRadius: CRM_RADIUS.pill },
  overdueText: { fontSize: 10, fontWeight: "800", color: "#B91C1C" },
  saleStats: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4 },
  saleStat: { fontSize: 12, color: "#6B7280" },
  bold: { fontWeight: "800", color: "#111827" },
  center: { alignItems: "center", paddingVertical: 40, gap: 10 },
  centerText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  retry: { fontSize: 13, color: CRM_COLORS.primary, fontWeight: "700" },
});
