import React, { useEffect, useState } from "react";
import { TextInput } from "react-native";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import TicketSheet, { InfoNote, SheetField, sheetInputStyle } from "../TicketSheet";

// Các thao tác chỉ cần một ô ghi chú (backend bắt buộc có ghi chú): trả lại, huỷ, mở lại, trả tờ trình về người tạo
export const NOTE_ACTIONS = {
  release: {
    action: "release",
    icon: "return-down-back",
    iconColor: "#DC2626",
    iconBg: "#FEF2F2",
    title: "Trả lại ticket",
    submitLabel: "Trả lại",
    submitColor: "#DC2626",
    label: "Lý do trả lại",
    placeholder: "Ví dụ: không thuộc phạm vi của phòng",
    info: "Ticket về trạng thái chưa ai nhận, người khác có thể nhận xử lý.",
  },
  cancel: {
    action: "cancel",
    icon: "close-circle-outline",
    iconColor: "#DC2626",
    iconBg: "#FEF2F2",
    title: "Huỷ ticket",
    submitLabel: "Huỷ ticket",
    submitColor: "#DC2626",
    label: "Lý do huỷ",
    placeholder: "Ví dụ: khách đã tự xử lý được",
  },
  reopen: {
    action: "reopen",
    icon: "refresh",
    iconColor: "#C2410C",
    iconBg: "#FFF7ED",
    title: "Mở lại ticket",
    submitLabel: "Mở lại",
    label: "Vì sao chưa ổn",
    placeholder: "Ví dụ: khách vẫn chưa nhận được tiền",
    info: "Ticket quay lại nhóm xử lý để tiếp tục.",
  },
  rejectApproval: {
    action: "approval/verify",
    body: { valid: false },
    icon: "shield-outline",
    iconColor: "#B91C1C",
    iconBg: "#FEE2E2",
    title: "Trả tờ trình về người tạo",
    submitLabel: "Trả về",
    submitColor: "#DC2626",
    label: "Lý do không hợp lệ",
    placeholder: "Ví dụ: thiếu chữ ký giám đốc",
  },
};

const NoteActionSheet = ({ visible, onClose, ticket, kind }) => {
  const config = NOTE_ACTIONS[kind] ?? NOTE_ACTIONS.release;
  const [note, setNote] = useState("");
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);

  useEffect(() => {
    if (!visible) return;
    setNote("");
    setError("");
  }, [visible]);

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon={config.icon}
      iconColor={config.iconColor}
      iconBg={config.iconBg}
      title={config.title}
      subtitle={ticket?.code}
      submitLabel={config.submitLabel}
      submitColor={config.submitColor}
      onSubmit={() => run(config.action, { ...config.body, note: note.trim() }, onClose)}
      submitting={isPending}
      submitDisabled={!note.trim()}
      error={error}
    >
      <SheetField label={config.label} required>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={config.placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 88, textAlignVertical: "top" }]}
        />
      </SheetField>
      {!!config.info && <InfoNote>{config.info}</InfoNote>}
    </TicketSheet>
  );
};

export default NoteActionSheet;
