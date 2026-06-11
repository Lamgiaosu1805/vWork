import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { fmtDate } from "../../../utils/crmUtils";

dayjs.extend(customParseFormat);
const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const PRIMARY = "#ED2E30";

const RangeDatePickerModal = ({
  visible,
  onClose,
  onConfirm,
  initialFrom,
  initialTo,
}) => {
  const today = dayjs().startOf("day");
  const [viewYear, setViewYear] = useState(today.year());
  const [viewMonth, setViewMonth] = useState(today.month());
  const [fromDate, setFromDate] = useState(initialFrom || null);
  const [toDate, setToDate] = useState(initialTo || null);
  const [step, setStep] = useState("from");

  const changeMonth = (delta) => {
    const next = dayjs(new Date(viewYear, viewMonth + delta, 1));
    setViewYear(next.year());
    setViewMonth(next.month());
  };

  const handleDayPress = (d) => {
    const picked = dayjs(new Date(viewYear, viewMonth, d));
    if (step === "from") {
      setFromDate(picked);
      setToDate(null);
      setStep("to");
    } else {
      if (fromDate && picked.isBefore(fromDate, "day")) {
        setFromDate(picked);
        setToDate(null);
        setStep("to");
      } else {
        setToDate(picked);
        setStep("to");
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(fromDate, toDate);
    onClose();
    setStep("from")
  };

  const handleClose = () => {
    setFromDate(initialFrom || null);
    setToDate(initialTo || null);
    setStep("from");
    onClose();
  };

  const firstDow = dayjs(new Date(viewYear, viewMonth, 1)).day();
  const daysInMonth = dayjs(new Date(viewYear, viewMonth + 1, 0)).date();

  const getDayStyle = (d) => {
    const cur = dayjs(new Date(viewYear, viewMonth, d));
    const isFrom = fromDate && cur.isSame(fromDate, "day");
    const isTo = toDate && cur.isSame(toDate, "day");
    const isInRange =
      fromDate &&
      toDate &&
      cur.isAfter(fromDate, "day") &&
      cur.isBefore(toDate, "day");
    const isToday = cur.isSame(today, "day");
    return { isFrom, isTo, isInRange, isToday };
  };

  useEffect(() => {
    setFromDate(initialFrom || null);
    setToDate(initialTo || null);
  }, [initialFrom, initialTo]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn khoảng ngày</Text>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!fromDate}
              style={[styles.confirmBtn, !fromDate && { opacity: 0.4 }]}
            >
              <Ionicons name="checkmark-sharp" size={24} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.rangeDisplay}>
            <TouchableOpacity
              style={[
                styles.rangeBox,
                step === "from" && styles.rangeBoxActive,
              ]}
              onPress={() => setStep("from")}
            >
              <Text style={styles.rangeBoxLabel}>Từ ngày</Text>
              <Text
                style={[
                  styles.rangeBoxValue,
                  !fromDate && styles.rangeBoxPlaceholder,
                ]}
              >
                {fmtDate(fromDate) || "dd/mm/yyyy"}
              </Text>
            </TouchableOpacity>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#9CA3AF"
              style={{ marginTop: 12 }}
            />

            <TouchableOpacity
              style={[styles.rangeBox, step === "to" && styles.rangeBoxActive]}
              onPress={() => setStep("to")}
            >
              <Text style={styles.rangeBoxLabel}>Đến ngày</Text>
              <Text
                style={[
                  styles.rangeBoxValue,
                  !toDate && styles.rangeBoxPlaceholder,
                ]}
              >
                {fmtDate(toDate) || "dd/mm/yyyy"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calNav}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => changeMonth(-1)}
            >
              <Ionicons name="chevron-back" size={18} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => changeMonth(1)}
            >
              <Ionicons name="chevron-forward" size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {DAYS.map((d) => (
              <Text key={d} style={styles.dayName}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.dayGrid}>
            {Array.from({ length: firstDow }).map((_, i) => (
              <View key={`e-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const { isFrom, isTo, isInRange, isToday } = getDayStyle(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayCell,
                    isInRange && styles.dayCellRange,
                    (isFrom || isTo) && styles.dayCellSelected,
                    isFrom && styles.dayCellFrom,
                    isTo && styles.dayCellTo,
                  ]}
                  onPress={() => handleDayPress(d)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      (isFrom || isTo) && styles.dayTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                  {isToday && !(isFrom || isTo) && (
                    <View style={styles.todayDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default RangeDatePickerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 64,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  confirmBtn: { paddingHorizontal: 4 },

  rangeDisplay: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rangeBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
  },
  rangeBoxActive: { borderColor: PRIMARY, backgroundColor: "#FFF5F5" },
  rangeBoxLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
  rangeBoxValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  rangeBoxPlaceholder: { color: "#D1D5DB", fontWeight: "400" },

  calNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontSize: 14, fontWeight: "700", color: "#111827" },

  weekRow: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 4 },
  dayName: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    paddingVertical: 4,
  },

  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
  },
  dayCellFrom: {
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  dayCellTo: {
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  dayCellRange: { backgroundColor: "#FFE4E4", borderRadius: 999 },

  dayText: { fontSize: 13, color: "#111827" },
  dayTextSelected: { color: "#fff", fontWeight: "700" },
  dayTextToday: { color: PRIMARY, fontWeight: "600" },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PRIMARY,
    marginTop: 2,
  },
});
