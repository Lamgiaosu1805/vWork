import React, { useEffect, useState } from "react";
import { TextInput } from "react-native";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import { toIsoDate } from "../../lib/ticketFormat";
import TicketDateField from "../TicketDateField";
import TicketSheet, { InfoNote, SheetField, sheetInputStyle } from "../TicketSheet";

const HoldSheet = ({ visible, onClose, ticket }) => {
  const [reason, setReason] = useState("");
  const [resumeAt, setResumeAt] = useState(null);
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);

  useEffect(() => {
    if (!visible) return;
    setReason("");
    setResumeAt(null);
    setError("");
  }, [visible]);

  const submit = () =>
    run("hold", { reason: reason.trim(), resumeAt: toIsoDate(resumeAt) }, onClose);

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="pause-circle-outline"
      iconColor="#6D28D9"
      iconBg="#F5F3FF"
      title="Tạm hoãn ticket"
      subtitle={ticket?.code}
      submitLabel="Tạm hoãn"
      onSubmit={submit}
      submitting={isPending}
      submitDisabled={!reason.trim()}
      error={error}
    >
      <SheetField label="Lý do" required>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Vì sao chưa thể xử lý tiếp"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 88, textAlignVertical: "top" }]}
        />
      </SheetField>
      <SheetField label="Ngày dự kiến tiếp tục">
        <TicketDateField value={resumeAt} onChange={setResumeAt} minimumDate={new Date()} clearable />
      </SheetField>
      <InfoNote tone="warning">
        Nếu để trống ngày, ticket tạm hoãn quá lâu sẽ vào mục Cần chú ý.
      </InfoNote>
    </TicketSheet>
  );
};

export default HoldSheet;
