import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import useTicketSearch from "../../hooks/useTicketSearch";
import { resolutionOptionsOf } from "../../lib/ticketFormat";
import TicketSheet, { SheetField, sheetInputStyle } from "../TicketSheet";

// Kết quả bắt buộc ghi lý do (đóng mà không giải quyết được) — khớp RESOLUTIONS_REQUIRING_NOTE ở backend
const NOTE_REQUIRED = ["wont_fix", "insufficient_basis", "not_a_bug"];

const CloseSheet = ({ visible, onClose, ticket, meta }) => {
  const options = resolutionOptionsOf(ticket, meta);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [search, setSearch] = useState("");
  const [duplicate, setDuplicate] = useState(null);
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);
  const { results, isFetching } = useTicketSearch(code === "duplicate" ? search : "");

  useEffect(() => {
    if (!visible) return;
    setCode(options.some((item) => item.code === "solved") ? "solved" : "");
    setNote("");
    setActionTaken("");
    setSearch("");
    setDuplicate(null);
    setError("");
  }, [visible]);

  const valid =
    code &&
    (!NOTE_REQUIRED.includes(code) || note.trim()) &&
    (code !== "duplicate" || duplicate);

  const submit = () =>
    run(
      "close",
      {
        code,
        note: note.trim(),
        actionTaken: actionTaken.trim(),
        ...(code === "duplicate" && { duplicateOf: duplicate.id }),
      },
      onClose,
    );

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="lock-closed-outline"
      iconColor="#374151"
      iconBg="#E5E7EB"
      title="Đóng ticket"
      subtitle="Kết thúc mà không cần người tạo xác nhận"
      submitLabel="Đóng ticket"
      submitColor="#374151"
      onSubmit={submit}
      submitting={isPending}
      submitDisabled={!valid}
      error={error}
    >
      <SheetField label="Kết quả" required>
        <View style={styles.options}>
          {options.map((item) => {
            const active = item.code === code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => setCode(item.code)}
              >
                <Ionicons
                  name={active ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={active ? "#FF5722" : "#9CA3AF"}
                />
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SheetField>

      {code === "duplicate" && (
        <SheetField label="Trùng với ticket (cùng khách và cùng sự việc)" required>
          {duplicate ? (
            <View style={styles.picked}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickedCode}>{duplicate.code}</Text>
                <Text style={styles.pickedTitle} numberOfLines={1}>
                  {duplicate.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDuplicate(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[sheetInputStyle, styles.searchBox]}>
                <Ionicons name="search-outline" size={18} color="#6B7280" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Nhập mã hoặc tiêu đề (từ 2 ký tự)"
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
                {isFetching && <ActivityIndicator size="small" color="#9CA3AF" />}
              </View>
              {results
                .filter((item) => item.id !== ticket.id)
                .slice(0, 6)
                .map((item) => (
                  <TouchableOpacity key={item.id} style={styles.result} onPress={() => setDuplicate(item)}>
                    <Text style={styles.pickedCode}>{item.code}</Text>
                    <Text style={styles.pickedTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
            </>
          )}
        </SheetField>
      )}

      <SheetField label="Lý do / ghi chú kết luận" required={NOTE_REQUIRED.includes(code)}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Ghi rõ lý do, bắt buộc với Không giải quyết / Chưa đủ cơ sở / Không phải lỗi"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 80, textAlignVertical: "top" }]}
        />
      </SheetField>
      <SheetField label="Đã làm gì, trên hệ thống nào (không bắt buộc)">
        <TextInput
          value={actionTaken}
          onChangeText={setActionTaken}
          placeholder="Ví dụ: đã kiểm tra log hệ thống thanh toán"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 64, textAlignVertical: "top" }]}
        />
      </SheetField>
    </TicketSheet>
  );
};

export default CloseSheet;

const styles = StyleSheet.create({
  options: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  optionActive: { backgroundColor: "#FFF3EE" },
  optionText: { fontSize: 14, color: "#1A1D26" },
  optionTextActive: { fontWeight: "700", color: "#BF360C" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 0 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: "#111827" },
  result: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: "#F9FAFB" },
  picked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF5722",
    backgroundColor: "#FFF3EE",
  },
  pickedCode: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  pickedTitle: { fontSize: 13, color: "#1A1D26", marginTop: 2 },
});
