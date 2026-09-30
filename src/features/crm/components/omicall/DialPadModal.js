import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Delete, Grid3x3, Phone, PhoneCall } from "lucide-react-native";
import dayjs from "dayjs";
import { CustomKeyboard } from "./CustomKeyboard";
import { CRM_COLORS, CRM_RADIUS } from "../../theme/colors";
import { useAppSwitcher } from "../../context/AppSwitcherContext";
import { useCallHistory } from "../../../crmCustomerCall";

export const DialPadModal = ({ visible, onClose, onCall }) => {
  const [dialedNumber, setDialedNumber] = useState("");
  const sheetRef = useRef(null);
  const { appCode } = useAppSwitcher();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setDialedNumber("");
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const historyQuery = useCallHistory(appCode ? { appCode } : {}, { enabled: !!visible });
  const recentCalls = useMemo(() => historyQuery.data?.pages?.flatMap((p) => p.items) ?? [], [historyQuery.data]);

  const handlePressDigit = (digit) => setDialedNumber((prev) => prev + digit);
  const handleBackspace = () => setDialedNumber((prev) => prev.slice(0, -1));

  const handlePressCall = () => {
    const phoneNumber = dialedNumber.trim();
    if (!phoneNumber) return;
    onCall?.(phoneNumber);
  };

  const handleSelectRecent = (item) => {
    if (!item.phone_number) return;
    onCall?.(item.phone_number);
  };

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />,
    [],
  );

  return (
    <Modal visible={!!visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
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

            <FlatList
              data={recentCalls}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.recentListContent}
              ListHeaderComponent={<Text style={styles.recentTitle}>Cuộc gọi gần nhất</Text>}
              ListEmptyComponent={<Text style={styles.recentEmpty}>Chưa có dữ liệu</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.recentRow} activeOpacity={0.7} onPress={() => handleSelectRecent(item)}>
                  <View style={styles.recentIconWrap}>
                    <PhoneCall size={16} color={CRM_COLORS.primary} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {item.customerName || item.phone_number}
                    </Text>
                    <Text style={styles.recentPhone} numberOfLines={1}>
                      {item.phone_number}
                    </Text>
                  </View>
                  <Text style={styles.recentTime}>{dayjs(item.time_start_call).format("HH:mm DD/MM")}</Text>
                </TouchableOpacity>
              )}
              onEndReached={() => historyQuery.hasNextPage && !historyQuery.isFetchingNextPage && historyQuery.fetchNextPage()}
              onEndReachedThreshold={0.4}
            />

            <TouchableOpacity style={styles.fabKeypad} activeOpacity={0.85} onPress={() => sheetRef.current?.present()}>
              <Grid3x3 size={26} color="#fff" strokeWidth={2.2} />
            </TouchableOpacity>

            <BottomSheetModal
              ref={sheetRef}
              snapPoints={["85%"]}
              backdropComponent={renderBackdrop}
              backgroundStyle={styles.sheetBg}
              handleIndicatorStyle={styles.handle}
            >
              <BottomSheetView style={[styles.dialPanel, { paddingBottom: insets.bottom + 24 }]}>
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
                </View>

                <CustomKeyboard callback={handlePressDigit} />

                <View style={styles.bottomRow}>
                  <View style={styles.sideBtn} />

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
              </BottomSheetView>
            </BottomSheetModal>
          </View>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
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
  recentListContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, flexGrow: 1 },
  recentTitle: { fontSize: 15, fontWeight: "600", color: "#8B95A5", marginBottom: 4 },
  recentEmpty: { marginTop: 32, textAlign: "center", color: "#9CA3AF", fontSize: 15 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  recentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: CRM_RADIUS.pill,
    backgroundColor: "#FFF3EE",
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  recentPhone: { fontSize: 12, color: "#9CA3AF", fontWeight: "500", marginTop: 2 },
  recentTime: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  fabKeypad: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
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
  sheetBg: { backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  handle: { backgroundColor: "#E2E8F0" },
  dialPanel: { flex: 1, paddingTop: 4, paddingHorizontal: 24 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 48,
  },
  numberDisplay: { fontSize: 30, fontWeight: "700", color: "#1F2937", letterSpacing: 1, textAlign: "center" },
  numberPlaceholder: { fontSize: 22, fontWeight: "600", color: "#C5CDD7", textAlign: "center" },
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
