import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import {
  createCustomerInteraction,
  getCustomerInteractions,
} from "../../../api/crm/customer";

const PRIMARY = "#ED2E30";
const RESULTS = [
  { value: "", label: "Chưa chọn kết quả" },
  { value: "interested", label: "Quan tâm" },
  { value: "not_interested", label: "Không quan tâm" },
  { value: "need_more_info", label: "Cần thêm thông tin" },
  { value: "will_invest", label: "Sẽ đầu tư" },
  { value: "invested", label: "Đã đầu tư" },
  { value: "no_answer", label: "Không nghe máy/không phản hồi" },
];

const resultLabel = (value) =>
  RESULTS.find((item) => item.value === value)?.label || "Chưa cập nhật";

export default function CustomerInteractionTab({ externalId }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "call",
    content: "",
    result: "",
    nextDescription: "",
    nextDate: "",
  });

  const load = useCallback(
    async (nextPage = 1) => {
      if (!externalId) return;
      setLoading(true);
      try {
        const response = await getCustomerInteractions(externalId, {
          page: nextPage,
          limit: 10,
        });
        const payload = response.data;
        setItems((previous) =>
          nextPage === 1
            ? payload?.data || []
            : [...previous, ...(payload?.data || [])],
        );
        setPage(payload?.pagination?.page || nextPage);
        setTotalPages(payload?.pagination?.total_pages || 1);
      } catch (error) {
        Toast.show({
          type: "error",
          text1:
            error?.response?.data?.message || "Không thể tải lịch sử chăm sóc",
        });
      } finally {
        setLoading(false);
      }
    },
    [externalId],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const submit = async () => {
    if (!form.content.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập nội dung chăm sóc" });
      return;
    }
    setSubmitting(true);
    try {
      await createCustomerInteraction(externalId, {
        type: form.type,
        content: form.content.trim(),
        result: form.result || null,
        next_action: {
          description: form.nextDescription,
          due_date: form.nextDate || null,
        },
      });
      Toast.show({ type: "success", text1: "Đã lưu báo cáo chăm sóc" });
      setForm({
        type: "call",
        content: "",
        result: "",
        nextDescription: "",
        nextDate: "",
      });
      load(1);
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error?.response?.data?.message || "Không thể lưu báo cáo chăm sóc",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Báo cáo chăm sóc khách hàng</Text>
      <Text style={styles.subtitle}>
        Ghi lại cuộc gọi hoặc tin nhắn sau mỗi lần chăm sóc.
      </Text>
      <View style={styles.form}>
        <View style={styles.row}>
          <Dropdown
            style={styles.dropdown}
            data={[
              { value: "call", label: "Gọi điện" },
              { value: "message", label: "Nhắn tin" },
            ]}
            labelField="label"
            valueField="value"
            value={form.type}
            onChange={(item) =>
              setForm((prev) => ({ ...prev, type: item.value }))
            }
          />
          <Dropdown
            style={styles.dropdown}
            data={RESULTS}
            labelField="label"
            valueField="value"
            value={form.result}
            placeholder="Kết quả"
            onChange={(item) =>
              setForm((prev) => ({ ...prev, result: item.value }))
            }
          />
        </View>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.content}
          onChangeText={(content) => setForm((prev) => ({ ...prev, content }))}
          placeholder="Nội dung chăm sóc *"
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={2000}
          textAlignVertical="top"
        />
        <TextInput
          style={styles.input}
          value={form.nextDescription}
          onChangeText={(nextDescription) =>
            setForm((prev) => ({ ...prev, nextDescription }))
          }
          placeholder="Việc cần làm tiếp theo (không bắt buộc)"
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          value={form.nextDate}
          onChangeText={(nextDate) =>
            setForm((prev) => ({ ...prev, nextDate }))
          }
          placeholder="Ngày hẹn tiếp theo: YYYY-MM-DD HH:mm"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={[styles.saveButton, submitting && styles.disabled]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" color="#fff" size={17} />
              <Text style={styles.saveText}>Lưu báo cáo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.historyTitle}>Lịch sử chăm sóc</Text>
      {loading && !items.length ? (
        <ActivityIndicator color={PRIMARY} style={{ marginVertical: 24 }} />
      ) : (
        items.map((item) => (
          <View key={item._id} style={styles.item}>
            <View style={styles.itemHeader}>
              <View
                style={[
                  styles.typeChip,
                  item.type === "message" && styles.messageChip,
                ]}
              >
                <Ionicons
                  name={
                    item.type === "call" ? "call-outline" : "chatbubble-outline"
                  }
                  size={13}
                  color={item.type === "call" ? PRIMARY : "#6D28D9"}
                />
                <Text
                  style={[
                    styles.typeText,
                    item.type === "message" && styles.messageText,
                  ]}
                >
                  {item.type === "call" ? "Gọi điện" : "Nhắn tin"}
                </Text>
              </View>
              <Text style={styles.date}>
                {dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}
              </Text>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.meta}>
              {item.sale_id?.full_name || "Sale"} · {resultLabel(item.result)}
            </Text>
            {(item.next_action?.description || item.next_action?.due_date) && (
              <Text style={styles.next}>
                Tiếp theo: {item.next_action.description || "--"}
                {item.next_action.due_date
                  ? ` · ${dayjs(item.next_action.due_date).format("DD/MM/YYYY HH:mm")}`
                  : ""}
              </Text>
            )}
          </View>
        ))
      )}
      {!loading && !items.length && (
        <Text style={styles.empty}>Chưa có báo cáo chăm sóc nào.</Text>
      )}
      {page < totalPages && (
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => load(page + 1)}
        >
          <Text style={styles.moreText}>Xem thêm</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { margin: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  form: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  row: { flexDirection: "row", gap: 8 },
  dropdown: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "#111827",
    fontSize: 13,
  },
  multiline: { height: 92, paddingTop: 10 },
  saveButton: {
    minHeight: 42,
    borderRadius: 9,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  disabled: { opacity: 0.6 },
  historyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginTop: 20,
    marginBottom: 8,
  },
  item: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeChip: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  messageChip: { backgroundColor: "#F3E8FF" },
  typeText: { fontSize: 11, color: PRIMARY, fontWeight: "800" },
  messageText: { color: "#6D28D9" },
  date: { fontSize: 11, color: "#6B7280" },
  content: { fontSize: 13, color: "#1F2937", lineHeight: 19, marginTop: 8 },
  meta: { fontSize: 11, color: "#6B7280", marginTop: 7 },
  next: { fontSize: 11, color: "#4B5563", marginTop: 5 },
  empty: { textAlign: "center", color: "#9CA3AF", paddingVertical: 22 },
  moreButton: { alignItems: "center", paddingVertical: 12 },
  moreText: { color: PRIMARY, fontWeight: "800", fontSize: 13 },
});
