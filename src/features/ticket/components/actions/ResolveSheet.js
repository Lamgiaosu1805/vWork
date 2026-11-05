import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import { toIsoDate } from "../../lib/ticketFormat";
import TicketDateField from "../TicketDateField";
import TicketSheet, { InfoNote, SheetField, sheetInputStyle } from "../TicketSheet";

const ResolveSheet = ({ visible, onClose, ticket }) => {
  const [actionTaken, setActionTaken] = useState("");
  const [note, setNote] = useState("");
  const [followUpOn, setFollowUpOn] = useState(false);
  const [checkAt, setCheckAt] = useState(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);

  useEffect(() => {
    if (!visible) return;
    setActionTaken("");
    setNote("");
    setFollowUpOn(false);
    setCheckAt(null);
    setFollowUpNote("");
    setError("");
  }, [visible]);

  // Khớp web/backend: cả hai ô chữ đều không bắt buộc; bật theo dõi thì phải ghi cần theo dõi gì, ngày không bắt buộc
  const valid = !followUpOn || followUpNote.trim();

  const submit = () =>
    run(
      "resolve",
      {
        actionTaken: actionTaken.trim(),
        note: note.trim(),
        followUp: followUpOn ? { checkAt: toIsoDate(checkAt), note: followUpNote.trim() } : null,
      },
      onClose,
    );

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="checkmark"
      iconColor="#15803D"
      iconBg="#DCFCE7"
      title="Báo xử lý xong"
      subtitle={ticket?.code}
      submitLabel="Gửi xác nhận"
      onSubmit={submit}
      submitting={isPending}
      submitDisabled={!valid}
      error={error}
    >
      <SheetField label="Đã làm gì">
        <TextInput
          value={actionTaken}
          onChangeText={setActionTaken}
          placeholder="Đã làm gì, trên hệ thống nào, cho khách hàng hoặc nhân viên nào"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 96, textAlignVertical: "top" }]}
        />
      </SheetField>

      <SheetField label="Kết quả / ghi chú cho người tạo">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Đã xử lý thế nào, có vấn đề gì phát sinh"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 64, textAlignVertical: "top" }]}
        />
      </SheetField>

      <View style={styles.followBox}>
        <View style={styles.followHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.followTitle}>Cần theo dõi thêm</Text>
            <Text style={styles.followDesc}>Ghi việc cần kiểm tra lại sau khi xử lý</Text>
          </View>
          <Switch
            value={followUpOn}
            onValueChange={setFollowUpOn}
            trackColor={{ true: "#FF5722", false: "#E5E7EB" }}
            thumbColor="#FFFFFF"
          />
        </View>
        {followUpOn && (
          <>
            <SheetField label="Cần theo dõi gì" required>
              <TextInput
                value={followUpNote}
                onChangeText={setFollowUpNote}
                placeholder="Ví dụ: kiểm tra khách rút lệnh tiếp theo bình thường"
                placeholderTextColor="#9CA3AF"
                style={sheetInputStyle}
              />
            </SheetField>
            <SheetField label="Ngày kiểm tra (không bắt buộc)">
              <TicketDateField value={checkAt} onChange={setCheckAt} minimumDate={new Date()} clearable />
            </SheetField>
          </>
        )}
      </View>

      <InfoNote>
        Người tạo sẽ nhận thông báo để xác nhận đã xong. Nếu chưa ổn, họ có thể mở lại ticket.
      </InfoNote>
    </TicketSheet>
  );
};

export default ResolveSheet;

const styles = StyleSheet.create({
  followBox: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 12, gap: 12 },
  followHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  followTitle: { fontSize: 14, fontWeight: "700", color: "#1A1D26" },
  followDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
