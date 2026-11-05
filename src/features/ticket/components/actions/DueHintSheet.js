import React, { useEffect, useState } from "react";
import { TextInput } from "react-native";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import { toIsoDate } from "../../lib/ticketFormat";
import TicketDateField from "../TicketDateField";
import TicketSheet, { InfoNote, SheetField, sheetInputStyle } from "../TicketSheet";

const DueHintSheet = ({ visible, onClose, ticket }) => {
  const [dueHintAt, setDueHintAt] = useState(null);
  const [reason, setReason] = useState("");
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);

  useEffect(() => {
    if (!visible) return;
    setDueHintAt(ticket?.dueHintAt ? new Date(ticket.dueHintAt) : null);
    setReason("");
    setError("");
  }, [visible]);

  // Dời ngày (đã đặt ngày trước đó) phải ghi lý do — khớp TicketEntity.setDueHint
  const rescheduling = Boolean(ticket?.dueHintAt);

  const submit = () =>
    run("due-hint", { dueHintAt: toIsoDate(dueHintAt), reason: reason.trim() }, onClose);

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="calendar-outline"
      iconColor="#1D4ED8"
      iconBg="#EFF3FF"
      title="Đổi ngày dự kiến"
      subtitle={ticket?.code}
      submitLabel="Lưu"
      onSubmit={submit}
      submitting={isPending}
      submitDisabled={!dueHintAt || (rescheduling && !reason.trim())}
      error={error}
    >
      <SheetField label="Ngày dự kiến xong" required>
        <TicketDateField value={dueHintAt} onChange={setDueHintAt} minimumDate={new Date()} />
      </SheetField>
      <SheetField label={rescheduling ? "Lý do dời ngày" : "Lý do"} required={rescheduling}>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Ví dụ: chờ đối tác đối soát"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 64, textAlignVertical: "top" }]}
        />
      </SheetField>
      <InfoNote>Quá ngày dự kiến mà ticket chưa xong sẽ vào mục Cần chú ý.</InfoNote>
    </TicketSheet>
  );
};

export default DueHintSheet;
