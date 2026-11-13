import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import TicketSheet, { SheetField, sheetInputStyle } from "../TicketSheet";

const INPUT_HINT = { file: "Đính kèm file", text: "Nhập thông tin", either: "Nhập hoặc đính kèm" };

const RequestInfoSheet = ({ visible, onClose, ticket, meta }) => {
  const catalog = meta?.infoRequestCatalog ?? [];
  // { [key]: ghi chú riêng của mục } — khớp checklist của web (mỗi mục chọn được ghi chú thêm)
  const [selected, setSelected] = useState({});
  const [note, setNote] = useState("");
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);

  useEffect(() => {
    if (!visible) return;
    setSelected({});
    setNote("");
    setError("");
  }, [visible]);

  const groups = catalog.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] ?? []).push(item);
    return acc;
  }, {});

  const toggle = (key) =>
    setSelected((current) => {
      if (key in current) {
        const { [key]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [key]: "" };
    });

  const count = Object.keys(selected).length;

  const submit = () => {
    const items = Object.entries(selected).map(([key, itemNote]) => ({ key, note: itemNote.trim() }));
    run("request-info", { items, note: note.trim() }, onClose);
  };

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="document-text-outline"
      iconColor="#B45309"
      iconBg="#FEF3C7"
      title="Yêu cầu bổ sung"
      subtitle="Ticket chuyển sang Chờ bổ sung"
      submitLabel={count ? `Gửi yêu cầu (${count})` : "Gửi yêu cầu"}
      onSubmit={submit}
      submitting={isPending}
      submitDisabled={count === 0}
      error={error}
      fullHeight
    >
      <SheetField label="Cần người tạo bổ sung" required>
        {Object.entries(groups).map(([group, items]) => (
          <View key={group} style={{ gap: 6, marginTop: 4 }}>
            <Text style={styles.group}>{group}</Text>
            <View style={styles.list}>
              {items.map((item, index) => {
                const checked = item.key in selected;
                return (
                  <View key={item.key} style={[index > 0 && styles.rowBorder, checked && styles.rowChecked]}>
                    <TouchableOpacity style={styles.row} onPress={() => toggle(item.key)}>
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={22}
                        color={checked ? "#FF5722" : "#9CA3AF"}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{item.label}</Text>
                        <Text style={styles.hint}>{INPUT_HINT[item.input] ?? ""}</Text>
                      </View>
                    </TouchableOpacity>
                    {checked && (
                      <TextInput
                        value={selected[item.key]}
                        onChangeText={(value) => setSelected((current) => ({ ...current, [item.key]: value }))}
                        placeholder={item.key === "other" ? "Ghi rõ cần bổ sung gì" : "Ghi chú cho mục này (không bắt buộc)"}
                        placeholderTextColor="#9CA3AF"
                        style={[sheetInputStyle, styles.itemNote]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </SheetField>

      <SheetField label="Ghi chú thêm cho người tạo">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Ví dụ: ảnh mặt sau lần trước bị mờ, anh chụp lại giúp em nhé"
          placeholderTextColor="#9CA3AF"
          multiline
          style={[sheetInputStyle, { minHeight: 72, textAlignVertical: "top" }]}
        />
      </SheetField>
    </TicketSheet>
  );
};

export default RequestInfoSheet;

const styles = StyleSheet.create({
  group: { fontSize: 11, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  list: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  rowChecked: { backgroundColor: "#FFF3EE" },
  label: { fontSize: 14, color: "#1A1D26", fontWeight: "500" },
  hint: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  itemNote: { marginHorizontal: 12, marginBottom: 10, minHeight: 40, paddingVertical: 8, backgroundColor: "#FFFFFF" },
});
