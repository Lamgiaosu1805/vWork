import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetBackdrop, BottomSheetFooter } from "@gorhom/bottom-sheet";
import dayjs from "dayjs";
import Toast from "react-native-toast-message";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { ArrowUpRight, ArrowDownLeft, PhoneCall, Play, Pause } from "lucide-react-native";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import useUpdateCallLogNote from "../hooks/useUpdateCallLogNote";

const DIRECTION_META = {
  outbound: { label: "Gọi đi", icon: ArrowUpRight, color: "#2563EB" },
  inbound: { label: "Gọi đến", icon: ArrowDownLeft, color: "#059669" },
  local: { label: "Nội bộ", icon: PhoneCall, color: "#6B7280" },
};

const formatSeconds = (sec) => {
  const s = Math.max(0, Math.round(sec ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

const formatMoney = (amount) => `${(amount ?? 0).toLocaleString("vi-VN")}`;

const CallHistoryDetailSheet = ({ record, onClose }) => {
  const sheetRef = useRef(null);
  const [localRecord, setLocalRecord] = useState(record);
  const [note, setNote] = useState(record?.note ?? "");
  const updateNoteMutation = useUpdateCallLogNote();
  const player = useAudioPlayer(localRecord?.recording_file_url || null);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (record) {
      setLocalRecord(record);
      setNote(record.note ?? "");
      sheetRef.current?.present();
    }
  }, [record]);

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />,
    [],
  );

  const handleDismiss = () => {
    player.pause();
    onClose();
  };

  const noteChanged = !!localRecord && note !== (localRecord.note ?? "");

  const handleSaveNote = () => {
    if (!noteChanged) return;
    updateNoteMutation.mutate(
      { id: localRecord._id, note },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Đã lưu ghi chú" });
          sheetRef.current?.dismiss();
        },
        onError: (err) => Toast.show({ type: "error", text1: "Không thể lưu ghi chú", text2: err?.response?.data?.message || "Lỗi không xác định" }),
      },
    );
  };

  const renderFooter = useCallback(
    (props) => (
      <BottomSheetFooter {...props} style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (!noteChanged || updateNoteMutation.isPending) && styles.saveBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleSaveNote}
          disabled={!noteChanged || updateNoteMutation.isPending}
        >
          {updateNoteMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Lưu ghi chú</Text>
          )}
        </TouchableOpacity>
      </BottomSheetFooter>
    ),
    [noteChanged, updateNoteMutation.isPending, note],
  );

  const direction = DIRECTION_META[localRecord?.direction] || DIRECTION_META.local;
  const DirectionIcon = direction.icon;
  const answered = (localRecord?.answer_sec ?? 0) > 0;

  const hasRecording = !!localRecord?.recording_file_url && (localRecord?.duration ?? 0) > 0;

  const handleTogglePlay = () => {
    if (playerStatus.playing) {
      player.pause();
    } else {
      if (playerStatus.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["60%"]}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      {!localRecord ? null : (
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.timeRow}>
              <DirectionIcon size={16} color={direction.color} strokeWidth={3} />
              <Text style={styles.timeText}>{dayjs(localRecord.time_start_call).format("HH:mm • DD/MM/YYYY")}</Text>
            </View>
            <Text style={styles.customerName}>{localRecord.customerName || "Không xác định"}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.customerPhone}>{localRecord.phone_number}</Text>
              <View style={[styles.statusBadge, answered ? styles.statusAnswered : styles.statusMissed]}>
                <Text style={[styles.statusText, answered ? styles.statusTextAnswered : styles.statusTextMissed]}>
                  {direction.label} / {answered ? "Đã nghe" : "Không trả lời"}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => sheetRef.current?.dismiss()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <Text style={styles.gridLabel}>Nhân viên thực hiện</Text>
            <Text style={styles.gridValue}>{localRecord.saleName || "—"}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.gridLabel}>Cước phí cuộc gọi</Text>
            <Text style={[styles.gridValue, { color: "#059669" }]}>{formatMoney(localRecord.call_out_price)}đ</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCellBordered}>
            <Text style={styles.gridLabelSmall}>Tổng thời gian</Text>
            <Text style={styles.gridValueLarge}>{formatSeconds(localRecord.duration)}</Text>
          </View>
          <View style={styles.gridCellBordered}>
            <Text style={styles.gridLabelSmall}>Thời lượng (thực nghe)</Text>
            <Text style={[styles.gridValueLarge, { color: CRM_COLORS.accent }]}>{formatSeconds(localRecord.bill_sec)}</Text>
          </View>
        </View>

        {hasRecording && (
          <TouchableOpacity style={styles.recordingBtn} activeOpacity={0.85} onPress={handleTogglePlay}>
            {playerStatus.playing ? (
              <Pause size={18} color={CRM_COLORS.accent} fill={CRM_COLORS.accent} />
            ) : (
              <Play size={18} color={CRM_COLORS.accent} fill={CRM_COLORS.accent} />
            )}
            <Text style={styles.recordingBtnText}>
              {playerStatus.playing ? "Đang phát ghi âm..." : "Nghe lại ghi âm"}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.noteLabel}>Ghi chú cuộc gọi</Text>
        <BottomSheetTextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Nhập ghi chú cho cuộc gọi này..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={{ height: 90 }} />
      </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
};

export default CallHistoryDetailSheet;

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: "#fff", borderTopLeftRadius: CRM_RADIUS.xl, borderTopRightRadius: CRM_RADIUS.xl },
  handle: { backgroundColor: "#D1D5DB" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "flex-start", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingBottom: 16, marginBottom: 16 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  timeText: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  customerName: { fontSize: 16, fontWeight: "800", color: "#111827", textTransform: "uppercase" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  customerPhone: { fontSize: 13, fontWeight: "700", color: "#4B5563" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: CRM_RADIUS.pill },
  statusAnswered: { backgroundColor: "#ECFDF5" },
  statusMissed: { backgroundColor: "#FEF2F2" },
  statusText: { fontSize: 9, fontWeight: "700" },
  statusTextAnswered: { color: "#047857" },
  statusTextMissed: { color: "#DC2626" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  gridRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  gridCell: { flex: 1, padding: 14, backgroundColor: "#F9FAFB", borderRadius: CRM_RADIUS.md, borderWidth: 1, borderColor: "#F3F4F6" },
  gridLabel: { fontSize: 11, fontWeight: "600", color: "#6B7280", marginBottom: 4 },
  gridValue: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  gridCellBordered: { flex: 1, padding: 14, borderWidth: 1, borderColor: "#F3F4F6", borderRadius: CRM_RADIUS.md },
  gridLabelSmall: { fontSize: 10, color: "#9CA3AF", fontWeight: "500", marginBottom: 4 },
  gridValueLarge: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  recordingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: CRM_RADIUS.pill,
    backgroundColor: "rgba(0,82,255,0.08)",
    marginBottom: 16,
  },
  recordingBtnText: { fontSize: 12, fontWeight: "700", color: CRM_COLORS.accent },
  noteLabel: { fontSize: 11, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 },
  noteInput: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: CRM_RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: "#374151", backgroundColor: "#F9FAFB", minHeight: 90 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  saveBtn: { backgroundColor: CRM_COLORS.primary, borderRadius: CRM_RADIUS.md, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
