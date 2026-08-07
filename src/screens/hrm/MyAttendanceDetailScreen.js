import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { ChevronLeft } from "lucide-react-native";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import Header from "../../components/Header";
import { getPeriodDates } from "../../helpers/payrollPeriod";
import useMyPayrollStats from "../../hooks/attendance/useMyPayrollStats";
import { COLORS } from "../../assets/theme/colors";

dayjs.locale("vi");

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const STATUS_API_LABEL = {
  present: "Đi làm",
  missed_clock: "Quên chấm",
  leave_paid: "Nghỉ phép có lương",
  leave_unpaid: "Nghỉ không lương",
  absent: "Vắng mặt",
  pending: "Đang chờ chấm công",
  remote: "Làm từ xa",
  business_trip: "Đi công tác",
  client_visit: "Đi gặp gỡ khách hàng",
};

const STATUS_CHIP_COLOR = {
  "Đi làm": { bg: "#DCFCE7", color: "#15803D" },
  "Làm nửa ngày": { bg: "#DBEAFE", color: "#1E40AF" },
  "Làm từ xa": { bg: "#EDE9FE", color: "#5B21B6" },
  "Đi công tác": { bg: "#E0E7FF", color: "#3730A3" },
  "Đi gặp gỡ khách hàng": { bg: "#FCE7F3", color: "#9D174D" },
  "Quên chấm": { bg: "#FEF3C7", color: "#92400E" },
  "Nghỉ phép có lương": { bg: "#DCFCE7", color: "#15803D" },
  "Nghỉ không lương": { bg: "#FEE2E2", color: "#DC2626" },
  "Vắng mặt": { bg: "#FEE2E2", color: "#DC2626" },
  "Đang chờ chấm công": { bg: "#F3F4F6", color: "#6B7280" },
  "Đi muộn": { bg: "#FEF3C7", color: "#92400E" },
  "Về sớm": { bg: "#FEF3C7", color: "#92400E" },
  "Cuối tuần": { bg: "#F3F4F6", color: "#6B7280" },
};

// Gộp tất cả status trong ngày (1 ngày có thể vừa "quên chấm" vừa "đi muộn") — port từ logic web
// để nhãn trạng thái hiển thị đồng nhất giữa app và web.
const getDayStatusLabels = (
  dayStatuses = [],
  { minutesLate = 0, minuteEarly = 0, date = null } = {},
) => {
  const values = new Set(dayStatuses.map((s) => s.status));
  const hasHalfPresent = dayStatuses.some(
    (s) => s.status === "present" && s.period === "half",
  );
  const labels = [];

  if (values.has("leave_paid")) labels.push(STATUS_API_LABEL.leave_paid);
  if (values.has("leave_unpaid")) labels.push(STATUS_API_LABEL.leave_unpaid);
  if (values.has("remote")) labels.push(STATUS_API_LABEL.remote);
  if (values.has("business_trip")) labels.push(STATUS_API_LABEL.business_trip);
  if (values.has("client_visit")) labels.push(STATUS_API_LABEL.client_visit);

  if (values.has("absent") || values.has("pending")) {
    const isPastDay = date
      ? dayjs(date).isBefore(dayjs(), "day")
      : values.has("absent");
    labels.push(isPastDay ? "Vắng mặt" : "Đang chờ chấm công");
  }

  if (values.has("missed_clock")) {
    labels.push("Quên chấm");
  } else if (values.has("present")) {
    if (hasHalfPresent) labels.push("Làm nửa ngày");
    if (!hasHalfPresent && minutesLate <= 0 && minuteEarly <= 0)
      labels.push("Đi làm");
  }

  if (minutesLate > 0) labels.push("Đi muộn");
  if (minuteEarly > 0) labels.push("Về sớm");

  if (!labels.length && dayStatuses[0]) {
    labels.push(
      STATUS_API_LABEL[dayStatuses[0].status] ?? dayStatuses[0].status,
    );
  }

  return [...new Set(labels)];
};

const transformRecord = (rec) => {
  const d = dayjs(rec.date);
  const isSunday = d.day() === 0;
  const minutesLate = rec.minutes_late ?? 0;
  const minuteEarly = rec.minute_early ?? 0;

  const statuses = isSunday
    ? ["Cuối tuần"]
    : getDayStatusLabels(rec.day_statuses ?? [], {
        minutesLate,
        minuteEarly,
        date: rec.date,
      });

  return {
    date: d.format("YYYY-MM-DD"),
    dateFull: d.format("DD/MM/YYYY"),
    weekdayShort: WEEKDAY_SHORT[d.day()],
    isToday: d.isSame(dayjs(), "day"),
    isSunday,
    check_in: rec.check_in ?? "—:—",
    check_out: rec.check_out ?? "—:—",
    work_unit: rec.work_unit ?? (isSunday ? null : 0),
    penalty_amount: rec.penalty_amount ?? 0,
    statuses,
  };
};

const fillPeriodDays = (daily, start, end) => {
  const dailyMap = new Map(
    (daily ?? []).map((r) => [dayjs(r.date).format("YYYY-MM-DD"), r]),
  );
  const days = [];
  let cur = start.startOf("day");
  const endDay = end.startOf("day");

  while (!cur.isAfter(endDay)) {
    const dateStr = cur.format("YYYY-MM-DD");
    const rec = dailyMap.get(dateStr) ?? {
      date: dateStr,
      check_in: null,
      check_out: null,
      work_unit: null,
      day_statuses: [],
      minutes_late: 0,
      minute_early: 0,
      penalty_amount: 0,
    };
    days.push(transformRecord(rec));
    cur = cur.add(1, "day");
  }

  return days;
};

const fmtPenalty = (amount) => `${Number(amount).toLocaleString("vi-VN")} ₫`;

const DayRow = ({ record: r, onPress }) => {
  const accentColor =
    STATUS_CHIP_COLOR[r.statuses[0]]?.color ?? COLORS.neutral.neutral300;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(r)}
      style={[
        styles.dayRow,
        { borderLeftColor: accentColor },
        r.isToday && styles.dayRowToday,
        r.isSunday && styles.dayRowSunday,
      ]}
    >
      {r.penalty_amount > 0 && <View style={styles.penaltyDot} />}

      <View style={[styles.dayBadge, r.isToday && styles.dayBadgeToday]}>
        <Text
          style={[
            styles.dayBadgeWeekday,
            r.isToday && styles.dayBadgeTextToday,
          ]}
        >
          {r.weekdayShort}
        </Text>
      </View>

      <View style={styles.dayMid}>
        <Text style={styles.dayDate}>{r.dateFull}</Text>
        <Text style={styles.dayTime}>
          {r.isSunday ? "—" : `${r.check_in} · ${r.check_out}`}
        </Text>
      </View>

      <View style={styles.dayRight}>
        {r.statuses.map((label) => (
          <View
            key={label}
            style={[
              styles.chip,
              { backgroundColor: STATUS_CHIP_COLOR[label]?.bg ?? "#F3F4F6" },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: STATUS_CHIP_COLOR[label]?.color ?? "#6B7280" },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const DetailRow = ({ label, value, valueColor }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
      {value}
    </Text>
  </View>
);

const DayDetailSheet = forwardRef(({ record: r }, ref) => {
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
    >
      {r && (
        <BottomSheetView style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View style={[styles.dayBadge, r.isToday && styles.dayBadgeToday]}>
              <Text
                style={[
                  styles.dayBadgeWeekday,
                  r.isToday && styles.dayBadgeTextToday,
                ]}
              >
                {r.weekdayShort}
              </Text>
            </View>
            <Text style={styles.sheetTitle}>{r.dateFull}</Text>
          </View>

          <View style={styles.sheetSection}>
            <DetailRow label="Giờ vào" value={r.isSunday ? "—" : r.check_in} />
            <DetailRow label="Giờ ra" value={r.isSunday ? "—" : r.check_out} />
            <DetailRow
              label="Số công"
              value={r.isSunday ? "—" : `${r.work_unit ?? 0} công`}
            />
            {r.penalty_amount > 0 && (
              <DetailRow
                label="Tiền phạt"
                value={fmtPenalty(r.penalty_amount)}
                valueColor={COLORS.error.error600}
              />
            )}
          </View>
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

export default function MyAttendanceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const offset = route.params?.initialOffset ?? 0;

  const { start, end } = getPeriodDates(offset);
  const month = end.month() + 1;
  const year = end.year();

  const {
    data: stats,
    isLoading,
    isRefetching,
    refetch,
  } = useMyPayrollStats(month, year);

  const records = useMemo(
    () => fillPeriodDays(stats?.daily, start, end),
    [stats, start, end],
  );

  const [selectedRecord, setSelectedRecord] = useState(null);
  const detailSheetRef = useRef(null);

  const openDetail = (record) => {
    setSelectedRecord(record);
    detailSheetRef.current?.present();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <Header
        title="Chi tiết bảng công"
        LeftIcon={ChevronLeft}
        onLeftPress={() => navigation.goBack()}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.Primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(r) => r.date}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[COLORS.Primary]}
              tintColor={COLORS.Primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <DayRow record={item} onPress={openDetail} />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <DayDetailSheet ref={detailSheetRef} record={selectedRecord} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },

  periodText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.neutral.neutral500,
    textAlign: "center",
    paddingVertical: 14,
  },

  listContent: { paddingBottom: 40 },
  separator: { height: 8 },

  dayRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dayRowToday: {
    borderWidth: 1.5,
    borderColor: COLORS.blue.blue200,
    backgroundColor: "#EFF6FF",
  },
  dayRowSunday: { opacity: 0.6, shadowOpacity: 0, elevation: 0 },
  penaltyDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error.error500,
  },

  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.neutral.neutral200,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeToday: { borderColor: COLORS.Primary },
  dayBadgeWeekday: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.neutral.neutral500,
    textTransform: "uppercase",
  },
  dayBadgeTextToday: { color: COLORS.Primary },

  dayMid: { flex: 1, gap: 4 },
  dayDate: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.neutral.neutral400,
  },
  dayTime: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.neutral.neutral800,
  },

  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: 11, fontWeight: "600" },

  dayRight: { alignItems: "flex-end", gap: 4, maxWidth: 110 },

  handleIndicator: { backgroundColor: COLORS.neutral.neutral300, width: 40 },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 28 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.neutral200,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text.dark },
  sheetSection: { marginTop: 14, gap: 12 },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text.bland },
  detailValue: { fontSize: 14, fontWeight: "600", color: COLORS.text.dark },
});
