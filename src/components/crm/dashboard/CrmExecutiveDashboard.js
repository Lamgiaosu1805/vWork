import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { getCrmExecutiveDashboard, getCrmFunnelCustomers } from "../../../api/crm/dashboard";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const PRIMARY = "#5B5BD6";
const FUNNEL_COLORS = ["#332D85", "#4437A6", "#5847BE", "#6D59D1", "#806CE0", "#9583EA", "#AA9BF3", "#BFB4F8"];
const AUM_COLORS = ["#5B5BD6", "#21A179", "#F59E0B"];

const money = (value = 0) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} Tỷ`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)} Tr`;
  return Number(value).toLocaleString("vi-VN");
};

const getRange = (period) => {
  const now = dayjs();
  if (period === "today") return { from_date: now.startOf("day").toISOString(), to_date: now.toISOString() };
  if (period === "month") return { from_date: now.startOf("month").toISOString(), to_date: now.toISOString() };
  if (period === "quarter") return { from_date: now.month(Math.floor(now.month() / 3) * 3).startOf("month").toISOString(), to_date: now.toISOString() };
  if (period === "year") return { from_date: now.startOf("year").toISOString(), to_date: now.toISOString() };
  return {};
};

const MetricCard = ({ icon, label, metric, formatValue = (value) => value }) => {
  const positive = (metric?.trend?.percent ?? 0) >= 0;
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}><Ionicons name={icon} size={20} color={PRIMARY} /></View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{formatValue(metric?.value || 0)}</Text>
      <Text style={[styles.metricTrend, metric?.trend?.percent != null && { color: positive ? "#059669" : "#DC2626" }]}>
        {metric?.trend?.label || "N/A"} so với kỳ trước
      </Text>
    </View>
  );
};

const DateRangeModal = ({ visible, value, onClose, onApply }) => {
  const [from, setFrom] = useState(value.from_date ? new Date(value.from_date) : dayjs().startOf("month").toDate());
  const [to, setTo] = useState(value.to_date ? new Date(value.to_date) : new Date());
  useEffect(() => {
    if (visible) {
      setFrom(value.from_date ? new Date(value.from_date) : dayjs().startOf("month").toDate());
      setTo(value.to_date ? new Date(value.to_date) : new Date());
    }
  }, [value.from_date, value.to_date, visible]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dateModal} onPress={() => {}}>
          <Text style={styles.modalTitle}>Tùy chọn khoảng thời gian</Text>
          <Text style={styles.dateLabel}>Từ ngày</Text>
          <DateTimePicker value={from} mode="date" onChange={(_, date) => date && setFrom(date)} />
          <Text style={styles.dateLabel}>Đến ngày</Text>
          <DateTimePicker value={to} mode="date" maximumDate={new Date()} onChange={(_, date) => date && setTo(date)} />
          {from > to && <Text style={styles.errorText}>Ngày bắt đầu không được lớn hơn ngày kết thúc</Text>}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryButtonText}>Hủy</Text></TouchableOpacity>
            <TouchableOpacity disabled={from > to} style={[styles.primaryButton, from > to && { opacity: 0.4 }]} onPress={() => onApply({ from_date: dayjs(from).startOf("day").toISOString(), to_date: dayjs(to).endOf("day").toISOString() })}><Text style={styles.primaryButtonText}>Áp dụng</Text></TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const FunnelModal = ({ stage, range, onClose }) => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (page = 1) => {
    if (!stage) return;
    setLoading(true);
    try {
      const response = await getCrmFunnelCustomers(stage.key, { ...range, page, limit: 10 });
      setCustomers(response.data || []);
      setPagination(response.pagination || { page: 1, total_pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [range, stage]);
  useEffect(() => { load(1); }, [load]);
  return (
    <Modal visible={Boolean(stage)} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.fullModal}>
        <View style={styles.fullModalHeader}>
          <View><Text style={styles.modalTitle}>{stage?.code} · {stage?.label}</Text><Text style={styles.modalSubtitle}>{pagination.total} khách hàng</Text></View>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#111827" /></TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={PRIMARY} /> : <ScrollView contentContainerStyle={{ padding: 16 }}>
          {customers.map((customer) => <View key={customer._id} style={styles.customerRow}><View style={styles.avatar}><Text style={styles.avatarText}>{customer.identity?.full_name?.charAt(0) || "NA"}</Text></View><View style={{ flex: 1 }}><Text style={styles.customerName}>{customer.identity?.full_name || "Chưa eKYC"}</Text><Text style={styles.customerMeta}>{customer.phone_number} · {customer.referred_by?.full_name || "Chưa phân công"}</Text></View></View>)}
          {!customers.length && <Text style={styles.emptyText}>Không có dữ liệu</Text>}
        </ScrollView>}
        {pagination.total_pages > 1 && <View style={styles.pagination}><TouchableOpacity disabled={pagination.page <= 1} onPress={() => load(pagination.page - 1)}><Text style={styles.pageButton}>‹ Trước</Text></TouchableOpacity><Text style={styles.pageText}>{pagination.page}/{pagination.total_pages}</Text><TouchableOpacity disabled={pagination.page >= pagination.total_pages} onPress={() => load(pagination.page + 1)}><Text style={styles.pageButton}>Sau ›</Text></TouchableOpacity></View>}
      </SafeAreaView>
    </Modal>
  );
};

export default function CrmExecutiveDashboard() {
  const [period, setPeriod] = useState("all");
  const [customRange, setCustomRange] = useState({});
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const range = useMemo(() => period === "custom" ? customRange : getRange(period), [customRange, period]);

  const load = useCallback(async () => {
    if (period === "custom" && !range.from_date) return;
    setLoading(true);
    setError("");
    try {
      setData(await getCrmExecutiveDashboard(range));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể tải dữ liệu Dashboard CRM");
    } finally {
      setLoading(false);
    }
  }, [period, range]);
  useEffect(() => { load(); }, [load]);

  const periods = [["all", "Tất cả"], ["today", "Hôm nay"], ["month", "Tháng này"], ["quarter", "Quý này"], ["year", "Năm nay"], ["custom", "Tùy chọn"]];
  const stages = data?.funnel?.stages || [];
  const aumSegments = data?.aumQuality?.segments || [];
  const kpiSegments = data?.interactionKpi?.segments || [];
  const pieData = aumSegments.map((item, index) => ({ value: item.amount, color: AUM_COLORS[index], text: `${item.percentage}%` }));
  const barData = kpiSegments.map((item) => ({ value: item.actual, label: item.label.replace("Đang đầu tư", "Đầu tư").replace("Đã tất toán", "Tất toán"), frontColor: PRIMARY, topLabelComponent: () => <Text style={styles.barValue}>{item.actual}</Text> }));
  const lineData = kpiSegments.map((item) => ({ value: item.target }));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Dashboard điều hành CRM</Text><Text style={styles.sectionSubtitle}>Chuyển đổi khách hàng và dòng vốn theo thời gian thực</Text></View>{loading && data && <ActivityIndicator color={PRIMARY} />}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periods}>
        {periods.map(([value, label]) => <TouchableOpacity key={value} style={[styles.periodChip, period === value && styles.periodChipActive]} onPress={() => { setPeriod(value); if (value === "custom") setShowDateModal(true); }}><Text style={[styles.periodText, period === value && styles.periodTextActive]}>{label}</Text></TouchableOpacity>)}
      </ScrollView>
      {data?.metrics && <Text style={styles.filterBadge}>Đang lọc: {data.metrics.filtered_customers} / {data.metrics.total_customers} khách hàng</Text>}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading && !data ? <ActivityIndicator style={{ padding: 40 }} color={PRIMARY} /> : data && <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 12 }}>
          <MetricCard icon="id-card-outline" label="Khách đã eKYC" metric={data.metrics.metrics.kyc_verified} />
          <MetricCard icon="people-outline" label="Khách đang đầu tư" metric={data.metrics.metrics.active_investors} />
          <MetricCard icon="wallet-outline" label="Tổng dòng tiền (AUM)" metric={data.metrics.metrics.aum} formatValue={money} />
        </ScrollView>

        <View style={styles.card}><Text style={styles.cardTitle}>Phễu chuyển đổi khách hàng</Text>{stages.map((stage, index) => <TouchableOpacity key={stage.key} onPress={() => setSelectedStage(stage)} style={[styles.funnelStage, { backgroundColor: FUNNEL_COLORS[index], width: `${100 - index * 6}%` }]}><Text style={styles.funnelText}>{stage.code} · {stage.label} · {stage.count} ({stage.percentage}%)</Text></TouchableOpacity>)}</View>

        <View style={styles.card}><Text style={styles.cardTitle}>Cơ cấu chất lượng doanh thu</Text>{pieData.some((item) => item.value > 0) ? <View style={{ alignItems: "center" }}><PieChart data={pieData} donut radius={95} innerRadius={58} centerLabelComponent={() => <View style={{ alignItems: "center" }}><Text style={styles.donutTotal}>100%</Text><Text style={styles.donutLabel}>Cơ cấu</Text></View>} /></View> : <Text style={styles.emptyText}>N/A</Text>}{aumSegments.map((item, index) => <View key={item.key} style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: AUM_COLORS[index] }]} /><Text style={styles.legendLabel}>{item.label}</Text><Text style={styles.legendValue}>{item.percentage}% · {money(item.amount)}</Text></View>)}</View>

        <View style={styles.card}><Text style={styles.cardTitle}>KPI tác nghiệp tương tác</Text><Text style={styles.sectionSubtitle}>Cột: thực tế · Đường: chỉ tiêu</Text>{barData.length ? <ScrollView horizontal><BarChart data={barData} showLine lineData={lineData} lineConfig={{ color: "#22A06B", thickness: 2, strokeDashArray: [5, 4], dataPointsColor: "#22A06B" }} height={240} width={Math.max(width - 72, 520)} barWidth={26} spacing={45} initialSpacing={25} yAxisThickness={0} xAxisThickness={0} xAxisLabelTextStyle={styles.xAxisLabel} noOfSections={4} /></ScrollView> : <Text style={styles.emptyText}>Chưa có dữ liệu tương tác</Text>}</View>
      </>}
      <DateRangeModal visible={showDateModal} value={customRange} onClose={() => setShowDateModal(false)} onApply={(value) => { setCustomRange(value); setPeriod("custom"); setShowDateModal(false); }} />
      <FunnelModal stage={selectedStage} range={range} onClose={() => setSelectedStage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 12, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  sectionSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  periods: { gap: 8, paddingVertical: 12 },
  periodChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, backgroundColor: "#F3F4F6" },
  periodChipActive: { backgroundColor: PRIMARY },
  periodText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  periodTextActive: { color: "#fff" },
  filterBadge: { alignSelf: "flex-end", fontSize: 11, color: "#4B5563", backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  metricCard: { width: 185, minHeight: 145, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 14 },
  metricIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F1EFFE", alignItems: "center", justifyContent: "center" },
  metricLabel: { fontSize: 12, color: "#6B7280", fontWeight: "700", marginTop: 10 },
  metricValue: { fontSize: 23, color: "#111827", fontWeight: "800", marginTop: 3 },
  metricTrend: { fontSize: 10, color: "#6B7280", fontWeight: "600", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", padding: 16, marginTop: 12, overflow: "hidden" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 12 },
  funnelStage: { alignSelf: "center", paddingVertical: 11, borderRadius: 5, marginBottom: 5, alignItems: "center" },
  funnelText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  donutTotal: { fontSize: 20, fontWeight: "800", color: "#111827" },
  donutLabel: { fontSize: 11, color: "#6B7280" },
  legendRow: { flexDirection: "row", alignItems: "center", paddingTop: 10 },
  legendDot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 12, color: "#374151" },
  legendValue: { fontSize: 12, fontWeight: "800", color: "#111827" },
  barValue: { fontSize: 9, color: "#4B5563" },
  xAxisLabel: { fontSize: 9, color: "#4B5563", width: 65 },
  emptyText: { textAlign: "center", color: "#9CA3AF", paddingVertical: 28 },
  errorText: { color: "#DC2626", fontSize: 12, marginTop: 8 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,.45)", justifyContent: "center", padding: 20 },
  dateModal: { backgroundColor: "#fff", borderRadius: 18, padding: 18 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  modalSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  dateLabel: { fontSize: 12, fontWeight: "700", color: "#374151", marginTop: 14 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  secondaryButton: { flex: 1, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10 },
  secondaryButtonText: { fontWeight: "700", color: "#374151" },
  primaryButton: { flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: PRIMARY, borderRadius: 10 },
  primaryButtonText: { fontWeight: "700", color: "#fff" },
  fullModal: { flex: 1, backgroundColor: "#F9FAFB" },
  fullModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  customerRow: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 9 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 12, fontWeight: "800", color: PRIMARY },
  customerName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  customerMeta: { fontSize: 11, color: "#6B7280", marginTop: 3 },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB", backgroundColor: "#fff" },
  pageButton: { color: PRIMARY, fontWeight: "700" },
  pageText: { fontSize: 12, color: "#6B7280" },
});
