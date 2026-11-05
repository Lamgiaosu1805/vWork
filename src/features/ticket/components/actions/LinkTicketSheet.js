import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import useTicketSearch from "../../hooks/useTicketSearch";
import { StatusPill } from "../TicketBadges";
import TicketSheet, { SheetField, sheetInputStyle } from "../TicketSheet";

const LinkTicketSheet = ({ visible, onClose, ticket }) => {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const { results, isFetching } = useTicketSearch(search);
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);

  useEffect(() => {
    if (!visible) return;
    setSearch("");
    setPicked(null);
    setError("");
  }, [visible]);

  const linkedIds = new Set([ticket?.id, ...(ticket?.relatedTicketIds ?? [])]);

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="link-outline"
      iconColor="#374151"
      iconBg="#F3F4F6"
      title="Liên kết ticket"
      subtitle={ticket?.code}
      submitLabel="Liên kết"
      onSubmit={() => run("links", { relatedTicketId: picked.id }, onClose)}
      submitting={isPending}
      submitDisabled={!picked}
      error={error}
      fullHeight
    >
      <SheetField label="Ticket liên quan" required>
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
          .filter((item) => !linkedIds.has(item.id))
          .slice(0, 8)
          .map((item) => {
            const active = picked?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.result, active && styles.resultActive]}
                onPress={() => setPicked(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.code}>{item.code}</Text>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
                <StatusPill status={item.status} />
              </TouchableOpacity>
            );
          })}
      </SheetField>
    </TicketSheet>
  );
};

export default LinkTicketSheet;

const styles = StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 0 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: "#111827" },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resultActive: { borderColor: "#FF5722", backgroundColor: "#FFF3EE" },
  code: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  title: { fontSize: 13, color: "#1A1D26", marginTop: 2 },
});
