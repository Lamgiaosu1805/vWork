import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { DAYS_LABEL } from "../../../constants/hrm";
import useGetAttendanceCalendar from "../../../hooks/requests/useGetAttendanceCalendar";

const MiniCalendar = ({
  selectedDate,
  startDate,
  endDate,
  hoverDate,
  isRange,
  onDayPress,
  onDayHover,
}) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const { data: attendanceCalendar, isLoading: attendanceCalendarLoading } =
    useGetAttendanceCalendar({
      month: currentMonth.month() + 1,
      year: currentMonth.year(),
    });
  const firstDay = currentMonth.startOf("month").day();
  const daysInMonth = currentMonth.daysInMonth();

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => currentMonth.date(i + 1)),
  ];

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  // pad last row
  if (rows.length && rows[rows.length - 1].length < 7) {
    while (rows[rows.length - 1].length < 7) rows[rows.length - 1].push(null);
  }

  const isSelected = (d) => {
    if (isRange) {
      return (
        (startDate && d.isSame(startDate, "day")) ||
        (endDate && d.isSame(endDate, "day"))
      );
    }
    return selectedDate && d.isSame(selectedDate, "day");
  };

  const isInRange = (d) => {
    if (!isRange) return false;
    const end = endDate || hoverDate;
    return (
      startDate && end && d.isAfter(startDate, "day") && d.isBefore(end, "day")
    );
  };

  return (
    <View>
      {/* Header tháng */}
      <View style={styles.calHeader}>
        <TouchableOpacity
          onPress={() => setCurrentMonth((m) => m.subtract(1, "month"))}
          style={styles.calArrow}
        >
          <Ionicons name="chevron-back" size={20} color={"#2A2A2A"} />
        </TouchableOpacity>

        <Text style={styles.calMonthLabel}>
          Tháng {currentMonth.month() + 1}/{currentMonth.year()}
        </Text>

        <TouchableOpacity
          onPress={() => setCurrentMonth((m) => m.add(1, "month"))}
          style={styles.calArrow}
        >
          <Ionicons name="chevron-forward" size={20} color={"#2A2A2A"} />
        </TouchableOpacity>
      </View>

      {/* Nhãn thứ */}
      <View style={styles.calWeekRow}>
        {DAYS_LABEL.map((d) => (
          <Text key={d} style={styles.calWeekLabel}>
            {d}
          </Text>
        ))}
      </View>

      {/* Các hàng ngày */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.calWeekRow}>
          {row.map((day, di) => {
            if (!day)
              return <View key={`e-${ri}-${di}`} style={styles.calCell} />;
            const sel = isSelected(day);
            const inRange = isInRange(day);
            const isToday = day.isSame(dayjs(), "day");
            return (
              <TouchableOpacity
                key={day.format("YYYY-MM-DD")}
                style={[
                  styles.calCell,
                  inRange && styles.calCellRange,
                  sel && styles.calCellSelected,
                ]}
                onPress={() => onDayPress(day)}
                onLongPress={() => onDayHover && onDayHover(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.calDayText,
                    isToday && !sel && styles.calDayToday,
                    sel && styles.calDaySelectedText,
                    inRange && styles.calDayRangeText,
                  ]}
                >
                  {day.date()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Chú thích */}
      <View style={styles.calLegend}>
        {[
          { label: "Ngày nghỉ lễ", color: "#38BDF8" },
          { label: "Xin nghỉ", color: "#FACC15" },
          { label: "Nghỉ không phép", color: "#EF4444" },
        ].map((it) => (
          <View key={it.label} style={styles.calLegendItem}>
            <View
              style={[styles.calLegendDot, { backgroundColor: it.color }]}
            />
            <Text style={styles.calLegendText}>{it.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default MiniCalendar;

const styles = StyleSheet.create({
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calArrow: { padding: 8 },
  calMonthLabel: { fontSize: 15, fontWeight: "700", color: "#2A2A2A" },
  calWeekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 2,
  },
  calWeekLabel: {
    width: 36,
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  calCell: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  calCellSelected: { backgroundColor: "#39C79A" },
  calCellRange: { backgroundColor: "rgba(57,199,154,0.15)", borderRadius: 0 },
  calDayText: { fontSize: 13, color: "#2A2A2A" },
  calDayToday: { color: "#39C79A", fontWeight: "700" },
  calDaySelectedText: { color: "#FFFFFF", fontWeight: "700" },
  calDayRangeText: { color: "#2FB286" },
  calLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    justifyContent: "center",
  },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  calLegendDot: { width: 8, height: 8, borderRadius: 4 },
  calLegendText: { fontSize: 11, color: "#9CA3AF" },
});
