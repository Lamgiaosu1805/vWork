import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { APPROVAL_DOCUMENT_KIND, TICKET_FILE_KIND_LABELS, TICKET_MAX_FILES } from "../../constants";
import useSubmitTicketInfo from "../../hooks/useSubmitTicketInfo";
import { errorMessageOf, formatFileSize, toIsoDate } from "../../lib/ticketFormat";
import { pickTicketDocuments, pickTicketImages } from "../../lib/pickTicketFiles";
import TicketDateField from "../TicketDateField";
import TicketSheet, { SheetField, sheetInputStyle } from "../TicketSheet";

export const PickedFile = ({ file, onRemove }) => (
  <View style={styles.file}>
    <Ionicons name={/^image\//.test(file.mimeType) ? "image-outline" : "document-outline"} size={18} color="#6B7280" />
    <View style={{ flex: 1 }}>
      <Text style={styles.fileName} numberOfLines={1}>
        {file.name}
      </Text>
      <Text style={styles.fileMeta}>
        {[formatFileSize(file.size), TICKET_FILE_KIND_LABELS[file.kind]].filter(Boolean).join(" · ")}
      </Text>
    </View>
    <TouchableOpacity hitSlop={8} onPress={onRemove}>
      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  </View>
);

export const AttachButtons = ({ onPick, compact }) => (
  <View style={styles.attachRow}>
    <TouchableOpacity style={styles.attachBtn} onPress={() => onPick("image")}>
      <Ionicons name="image-outline" size={16} color="#BF360C" />
      <Text style={styles.attachText}>{compact ? "Ảnh" : "Ảnh / video"}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.attachBtn} onPress={() => onPick("file")}>
      <Ionicons name="attach" size={16} color="#BF360C" />
      <Text style={styles.attachText}>Tệp</Text>
    </TouchableOpacity>
  </View>
);

// Người tạo trả lời yêu cầu bổ sung: mỗi mục "file" có ô đính kèm riêng (gắn đúng loại giấy tờ), mục "text" nhập
// chữ (gộp vào ghi chú), tờ trình có thêm số / ngày / người ký
const SubmitInfoSheet = ({ visible, onClose, ticket, meta }) => {
  const items = (ticket?.infoRequest?.items ?? []).filter((item) => !item.fulfilled);
  const inputOf = (key) => meta?.infoRequestCatalog?.find((entry) => entry.key === key)?.input ?? "either";
  const [files, setFiles] = useState([]);
  const [texts, setTexts] = useState({});
  const [note, setNote] = useState("");
  const [approvalRef, setApprovalRef] = useState({ number: "", date: null, signer: "" });
  const [error, setError] = useState("");
  const { mutateAsync, isPending } = useSubmitTicketInfo(ticket?.id);

  useEffect(() => {
    if (!visible) return;
    setFiles([]);
    setTexts({});
    setNote("");
    setApprovalRef({ number: "", date: null, signer: "" });
    setError("");
  }, [visible]);

  const asksApproval = items.some((item) => item.key === APPROVAL_DOCUMENT_KIND);
  const kindOf = (key) => (TICKET_FILE_KIND_LABELS[key] ? key : "other");

  const pick = async (key, source) => {
    if (files.length >= TICKET_MAX_FILES) {
      Toast.show({ type: "error", text1: `Tối đa ${TICKET_MAX_FILES} tệp` });
      return;
    }
    const kind = kindOf(key);
    const picked =
      source === "image" ? await pickTicketImages({ kind }) : await pickTicketDocuments({ kind });
    setFiles((current) =>
      [...current, ...picked.map((file) => ({ ...file, itemKey: key }))].slice(0, TICKET_MAX_FILES),
    );
  };

  // Khớp backend submitInfo: mục chỉ trả lời bằng chữ thì bắt buộc nhập; tờ trình phải có file mới, trừ khi người
  // tạo đã tải tờ trình lên SAU lúc bị yêu cầu (vd qua khung trao đổi) — số tờ trình không bắt buộc
  const requestedAt = ticket?.infoRequest?.requestedAt
    ? new Date(ticket.infoRequest.requestedAt).getTime()
    : null;
  const approvalUploadedSinceRequest = (ticket?.attachments ?? []).some(
    (file) =>
      file.kind === APPROVAL_DOCUMENT_KIND &&
      file.uploadedById &&
      file.uploadedById === ticket.createdBy?.id &&
      (requestedAt === null || new Date(file.createdAt).getTime() > requestedAt),
  );
  const approvalFile = files.some((file) => file.kind === APPROVAL_DOCUMENT_KIND);
  const approvalOk = !asksApproval || approvalFile || approvalUploadedSinceRequest;
  const textsOk = items
    .filter((item) => item.key !== APPROVAL_DOCUMENT_KIND && inputOf(item.key) === "text")
    .every((item) => texts[item.key]?.trim());
  const hasContent =
    files.length > 0 || note.trim() || Object.values(texts).some((value) => value.trim());

  const submit = async () => {
    setError("");
    const textLines = items
      .filter((item) => texts[item.key]?.trim())
      .map((item) => `${item.label}: ${texts[item.key].trim()}`);
    const payload = {
      note: [...textLines, note.trim()].filter(Boolean).join("\n"),
      version: ticket.version,
      ...(asksApproval &&
        approvalRef.number.trim() && {
        approvalReference: {
          number: approvalRef.number.trim(),
          date: toIsoDate(approvalRef.date),
          signer: approvalRef.signer.trim(),
        },
      }),
    };
    try {
      await mutateAsync({ payload, files });
      Toast.show({ type: "success", text1: "Đã gửi bổ sung" });
      onClose();
    } catch (err) {
      setError(errorMessageOf(err));
    }
  };

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="cloud-upload-outline"
      iconColor="#1D4ED8"
      iconBg="#EFF3FF"
      title="Gửi bổ sung"
      subtitle={`${ticket?.code ?? ""} · ${items.length} mục được yêu cầu`}
      submitLabel="Gửi bổ sung"
      onSubmit={submit}
      submitting={isPending}
      submitDisabled={!hasContent || !approvalOk || !textsOk}
      error={error}
      fullHeight
    >
      {items.map((item) => {
        const input = inputOf(item.key);
        const itemFiles = files.filter((file) => file.itemKey === item.key);
        const isApproval = item.key === APPROVAL_DOCUMENT_KIND;
        return (
          <SheetField
            key={item.key}
            label={item.label}
            required={isApproval ? !approvalUploadedSinceRequest : input === "text"}
            hint={
              isApproval && approvalUploadedSinceRequest
                ? "Bạn đã tải tờ trình lên sau khi được yêu cầu, không cần tải lại."
                : item.note || undefined
            }
          >
            {isApproval && (
              <View style={{ gap: 8 }}>
                <TextInput
                  value={approvalRef.number}
                  onChangeText={(number) => setApprovalRef((current) => ({ ...current, number }))}
                  placeholder="Số tờ trình, VD: TT-1025/2026"
                  placeholderTextColor="#9CA3AF"
                  style={sheetInputStyle}
                />
                <View style={styles.approvalRow}>
                  <View style={{ flex: 1 }}>
                    <TicketDateField
                      value={approvalRef.date}
                      placeholder="Ngày ký"
                      onChange={(date) => setApprovalRef((current) => ({ ...current, date }))}
                    />
                  </View>
                  <TextInput
                    value={approvalRef.signer}
                    onChangeText={(signer) => setApprovalRef((current) => ({ ...current, signer }))}
                    placeholder="Người ký"
                    placeholderTextColor="#9CA3AF"
                    style={[sheetInputStyle, { flex: 1 }]}
                  />
                </View>
              </View>
            )}
            {!isApproval && input !== "file" && (
              <TextInput
                value={texts[item.key] ?? ""}
                onChangeText={(value) => setTexts((current) => ({ ...current, [item.key]: value }))}
                placeholder="Nhập thông tin"
                placeholderTextColor="#9CA3AF"
                multiline
                style={[sheetInputStyle, { minHeight: 56, textAlignVertical: "top" }]}
              />
            )}
            {(isApproval || input !== "text") && (
              <>
                {itemFiles.map((file) => (
                  <PickedFile
                    key={file.uri}
                    file={file}
                    onRemove={() => setFiles((current) => current.filter((entry) => entry.uri !== file.uri))}
                  />
                ))}
                <AttachButtons onPick={(source) => pick(item.key, source)} />
              </>
            )}
          </SheetField>
        );
      })}

      <SheetField label="Ghi chú">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Ví dụ: đã chụp lại ảnh rõ hơn"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 64, textAlignVertical: "top" }]}
        />
      </SheetField>
    </TicketSheet>
  );
};

export default SubmitInfoSheet;

const styles = StyleSheet.create({
  approvalRow: { flexDirection: "row", gap: 8 },
  file: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  fileName: { fontSize: 13, fontWeight: "600", color: "#1A1D26" },
  fileMeta: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  attachRow: { flexDirection: "row", gap: 8 },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFF3EE",
  },
  attachText: { fontSize: 13, fontWeight: "700", color: "#BF360C" },
});
