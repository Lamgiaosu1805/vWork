import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, Delete, Phone, Settings, UserPlus } from "lucide-react-native";
import dayjs from "dayjs";
import { CustomKeyboard } from "./CustomKeyboard";
import { CRM_COLORS, CRM_RADIUS } from "../../theme/colors";
import { useAppSwitcher } from "../../context/AppSwitcherContext";
import { useCallHistory } from "../../../crmCustomerCall";

const RECENT_LIMIT = 3;

export const DialPadModal = ({ visible, onClose, onCall }) => {
  const [dialedNumber, setDialedNumber] = useState("");
  const { appCode } = useAppSwitcher();

  useEffect(() => {
    if (visible) setDialedNumber("");
  }, [visible]);

  const historyQuery = useCallHistory(appCode ? { appCode } : {}, { enabled: !!visible });
  const recentCalls = historyQuery.data?.pages?.[0]?.items?.slice(0, RECENT_LIMIT) ?? [];

  const handlePressDigit = (digit) => setDialedNumber((prev) => prev + digit);
  const handleBackspace = () => setDialedNumber((prev) => prev.slice(0, -1));
  const handlePressCall = () => {
    const phoneNumber = dialedNumber.trim();
    if (!phoneNumber) return;
    onCall?.(phoneNumber);
  };

  return (
    <Modal visible={!!visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft size={30} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            <Text style={{ color: CRM_COLORS.primary }}>VNFITE </Text>
            <Text style={{ color: "#fff" }}>Network</Text>
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Cuộc gọi gần nhất</Text>
          {recentCalls.length === 0 ? (
            <Text style={styles.recentEmpty}>Chưa có dữ liệu</Text>
          ) : (
            recentCalls.map((call) => (
              <View key={call._id} style={styles.recentRow}>
                <Text style={styles.recentName} numberOfLines={1}>
                  {call.customerName || call.phone_number}
                </Text>
                <Text style={styles.recentTime}>{dayjs(call.time_start_call).format("HH:mm DD/MM")}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.dialPanel}>
          <View style={styles.inputRow}>
            {dialedNumber ? (
              <Text style={styles.numberDisplay} numberOfLines={1}>
                {dialedNumber}
              </Text>
            ) : (
              <Text style={styles.numberPlaceholder} numberOfLines={1}>
                Nhập số điện thoại
              </Text>
            )}
            <View style={styles.addContactBtn}>
              <UserPlus size={22} color="#10B981" strokeWidth={2.5} />
            </View>
          </View>

          <CustomKeyboard callback={handlePressDigit} />

          <View style={styles.bottomRow}>
            <View style={styles.sideBtn}>
              <Settings size={24} color="#475569" strokeWidth={2.5} />
            </View>

            <TouchableOpacity
              style={[styles.callButton, !dialedNumber && styles.callButtonDisabled]}
              activeOpacity={0.85}
              onPress={handlePressCall}
              disabled={!dialedNumber}
            >
              <Phone size={32} color="#fff" fill="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideBtn} onPress={handleBackspace} disabled={!dialedNumber} activeOpacity={0.7}>
              <Delete size={24} color="#475569" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    backgroundColor: "#1C2C40",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  headerSpacer: { width: 32 },
  recentSection: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  recentTitle: { fontSize: 15, fontWeight: "600", color: "#8B95A5" },
  recentEmpty: { marginTop: 32, textAlign: "center", color: "#9CA3AF", fontSize: 15 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  recentName: { flex: 1, fontSize: 14, fontWeight: "700", color: "#1E293B" },
  recentTime: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  dialPanel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    minHeight: 48,
  },
  numberDisplay: { flex: 1, fontSize: 30, fontWeight: "700", color: "#1F2937", letterSpacing: 1 },
  numberPlaceholder: { flex: 1, fontSize: 22, fontWeight: "600", color: "#C5CDD7" },
  addContactBtn: {
    width: 46,
    height: 46,
    borderRadius: CRM_RADIUS.md,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: CRM_RADIUS.md,
    backgroundColor: "#F4F6F9",
    alignItems: "center",
    justifyContent: "center",
  },
  callButton: {
    width: 80,
    height: 80,
    borderRadius: CRM_RADIUS.pill,
    backgroundColor: CRM_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: CRM_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  callButtonDisabled: { opacity: 0.4 },
});
