import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import ImageView from "react-native-image-viewing";
import { TICKET_ACTIVITY_LABELS, TICKET_MAX_FILES, TICKET_PRIMARY } from "../../features/ticket/constants";
import useTicketDetail from "../../features/ticket/hooks/useTicketDetail";
import useTicketMeta from "../../features/ticket/hooks/useTicketMeta";
import useTicketEmployees from "../../features/ticket/hooks/useTicketEmployees";
import useAddTicketMessage from "../../features/ticket/hooks/useAddTicketMessage";
import { Avatar, StatusPill } from "../../features/ticket/components/TicketBadges";
import TicketAttachments, {
  FileBadge,
  isImageFile,
  isVideoFile,
  openTicketFile,
} from "../../features/ticket/components/TicketAttachments";
import { AutoSizeImage, VideoThumb } from "../../features/ticket/components/TicketMediaThumb";
import { pickTicketDocuments, pickTicketImages } from "../../features/ticket/lib/pickTicketFiles";
import { errorMessageOf, formatDate, formatMessageTime } from "../../features/ticket/lib/ticketFormat";

// Dòng sự kiện chen giữa tin nhắn (ai nhận, thêm người, đổi ngày...) để đọc trao đổi có ngữ cảnh
const EVENT_ACTIONS = [
  "claimed",
  "released",
  "assigned",
  "collaborator_added",
  "collaborator_removed",
  "info_requested",
  "info_submitted",
  "on_hold",
  "resumed",
  "resolved",
  "closed",
  "reopened",
  "due_hint_set",
];

const eventTextOf = (activity) => {
  const who = activity.actor?.name || "Hệ thống";
  switch (activity.action) {
    case "collaborator_added":
      return `${activity.note || "Một người"} được thêm làm người phối hợp`;
    case "collaborator_removed":
      return `${activity.note || "Một người"} không còn phối hợp`;
    case "due_hint_set": {
      const change = activity.changes?.find((item) => item.field === "dueHintAt");
      return change?.to ? `${who} đổi ngày dự kiến → ${formatDate(change.to)}` : `${who} đổi ngày dự kiến`;
    }
    default:
      return `${who}: ${TICKET_ACTIVITY_LABELS[activity.action] ?? activity.action}`;
  }
};

// Từ khoá đang gõ sau dấu @ cuối cùng (chưa có khoảng trắng) — để gợi ý người cần nhắc tên
const mentionQueryOf = (text) => {
  const match = /(?:^|\s)@([^\s@]*)$/.exec(text);
  return match ? match[1] : null;
};

  // Tô xanh "@Tên" của những người được nhắc trong tin nhắn
const renderBody = (message) => {
    const tokens = (message.mentions ?? []).map((item) => item.name && `@${item.name}`).filter(Boolean);
    if (!tokens.length) return message.body;
    const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return message.body.split(new RegExp(`(${escaped.join("|")})`)).map((part, index) =>
      tokens.includes(part) ? (
        <Text key={index} style={styles.mention}>
          {part}
        </Text>
      ) : (
        part
      ),
    );
  };


// Mỗi dòng memo riêng: gõ phím trong ô soạn (state của màn) không làm render lại cả danh sách tin nhắn / ảnh
const MessageRow = memo(({ item, ticketId, employeeId }) => {
  if (item.type === "event") {
    return (
      <View style={styles.event}>
        <Text style={styles.eventText}>
          {eventTextOf(item.activity)} · {formatMessageTime(item.at)}
        </Text>
      </View>
    );
  }
  const { message } = item;
  const mine = message.author?.id === employeeId;
  return (
    <View style={[styles.messageRow, mine && styles.messageRowMine]}>
      {!mine && <Avatar id={message.author?.id} name={message.author?.name} size={28} />}
      <View style={[styles.messageCol, mine && { alignItems: "flex-end" }]}>
        {!mine && (
          <Text style={styles.who}>
            {message.author?.name} · {formatMessageTime(message.createdAt)}
          </Text>
        )}
        {!!message.body && (
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, mine && { color: "#FFFFFF" }]}>
              {mine ? message.body : renderBody(message)}
            </Text>
          </View>
        )}
        {item.files.length > 0 && (
          <View style={{ width: 240 }}>
            <TicketAttachments
              ticketId={ticketId}
              files={item.files}
              maxWidth={240}
              align={mine ? "flex-end" : "flex-start"}
            />
          </View>
        )}
        {mine && <Text style={styles.time}>{formatMessageTime(message.createdAt)}</Text>}
      </View>
    </View>
  );
});

export default function TicketMessagesScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState([]);
  const [files, setFiles] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(-1);

  const { ticket, isLoading } = useTicketDetail(id);
  const { meta } = useTicketMeta();
  const { mutateAsync, isPending } = useAddTicketMessage(id);
  const employeeId = meta?.me?.employeeId;

  const mentionQuery = mentionQueryOf(text);
  // Gõ tên sau @ thì chờ 300ms mới tìm, tránh gọi API ở mỗi phím
  const [debouncedMention, setDebouncedMention] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMention(mentionQuery), mentionQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [mentionQuery]);
  const { employees } = useTicketEmployees(debouncedMention ?? "", {
    enabled: mentionQuery !== null && debouncedMention !== null,
  });

  const items = useMemo(() => {
    if (!ticket) return [];
    const attachmentsByMessage = (ticket.attachments ?? []).reduce((acc, file) => {
      if (file.messageId) (acc[file.messageId] = acc[file.messageId] ?? []).push(file);
      return acc;
    }, {});
    const messages = (ticket.messages ?? []).map((message) => ({
      type: "message",
      id: message.id,
      at: message.createdAt,
      message,
      files: attachmentsByMessage[message.id] ?? [],
    }));
    const events = (ticket.activities ?? [])
      .filter((activity) => EVENT_ACTIONS.includes(activity.action))
      .map((activity) => ({ type: "event", id: activity.id, at: activity.createdAt, activity }));
    return [...messages, ...events].sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [ticket]);

  useEffect(() => {
    if (items.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  }, [items.length]);

  const insertMention = (employee) => {
    const name = employee.fullName;
    setText((current) => current.replace(/@([^\s@]*)$/, `@${name} `));
    setMentions((current) =>
      current.some((item) => item.id === employee.id) ? current : [...current, { id: employee.id, name }],
    );
  };

  const pick = async (source) => {
    if (files.length >= TICKET_MAX_FILES) {
      Toast.show({ type: "error", text1: `Tối đa ${TICKET_MAX_FILES} tệp mỗi tin nhắn` });
      return;
    }
    const picked = source === "image" ? await pickTicketImages() : await pickTicketDocuments();
    setFiles((current) => [...current, ...picked].slice(0, TICKET_MAX_FILES));
  };

  const send = async () => {
    const body = text.trim();
    if (!body && files.length === 0) return;
    // Chỉ giữ người còn được nhắc trong nội dung (người dùng có thể đã xoá "@Tên" khỏi ô nhập)
    const mentionIds = mentions.filter((item) => body.includes(`@${item.name}`)).map((item) => item.id);
    try {
      await mutateAsync({ payload: { body, mentionIds }, files });
      setText("");
      setMentions([]);
      setFiles([]);
    } catch (err) {
      Toast.show({ type: "error", text1: errorMessageOf(err, "Gửi tin nhắn thất bại") });
    }
  };

  // File vừa chọn (chưa gửi): ảnh xem trước ngay trong ô soạn, tài liệu mở màn xem file bằng đường dẫn trên máy
  const pickedImages = files.filter((file) => isImageFile(file));
  const pickedMedia = files.filter((file) => isImageFile(file) || isVideoFile(file));
  const pickedDocs = files.filter((file) => !pickedMedia.includes(file));
  const removePicked = (uri) => setFiles((current) => current.filter((entry) => entry.uri !== uri));

  const renderItem = useCallback(
    ({ item }) => <MessageRow item={item} ticketId={id} employeeId={employeeId} />,
    [id, employeeId],
  );

  const canMessage = ticket?.capabilities?.message;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1D26" />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerTitle}>Trao đổi</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {ticket ? `${ticket.code} · ${ticket.title}` : ""}
          </Text>
        </View>
        {ticket && (
          <View style={{ marginRight: 8 }}>
            <StatusPill status={ticket.status} />
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {isLoading ? (
          <ActivityIndicator color={TICKET_PRIMARY} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>Chưa có trao đổi nào. Gửi tin nhắn đầu tiên nhé.</Text>
            }
            keyboardShouldPersistTaps="handled"
          />
        )}

        {canMessage ? (
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
            {mentionQuery !== null && employees.length > 0 && (
              <View style={styles.suggestions}>
                {employees.slice(0, 5).map((employee) => (
                  <TouchableOpacity
                    key={employee.id}
                    style={styles.suggestion}
                    onPress={() => insertMention(employee)}
                  >
                    <Avatar id={employee.id} name={employee.fullName} size={26} />
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {employee.fullName}
                    </Text>
                    <Text style={styles.suggestionDept} numberOfLines={1}>
                      {employee.departmentNames?.join(", ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {mentions.some((item) => text.includes(`@${item.name}`)) && (
              <View style={styles.chips}>
                {mentions
                  .filter((item) => text.includes(`@${item.name}`))
                  .map((item) => (
                    <View key={item.id} style={[styles.chip, styles.chipMention]}>
                      <Text style={styles.chipMentionText}>@{item.name}</Text>
                    </View>
                  ))}
              </View>
            )}

            {pickedMedia.length > 0 && (
              <View style={styles.previewRow}>
                {pickedMedia.map((file) => (
                  <View key={file.uri}>
                    {isVideoFile(file) ? (
                      <VideoThumb
                        source={{ uri: file.uri }}
                        knownSize={{ width: file.width, height: file.height }}
                        maxWidth={110}
                        maxHeight={80}
                        duration={file.duration}
                        onPress={() => openTicketFile({ file, localUri: file.uri })}
                      />
                    ) : (
                      <AutoSizeImage
                        source={{ uri: file.uri }}
                        knownSize={{ width: file.width, height: file.height }}
                        maxWidth={110}
                        maxHeight={80}
                        onPress={() => setPreviewIndex(pickedImages.indexOf(file))}
                      />
                    )}
                    <TouchableOpacity
                      style={styles.previewRemove}
                      hitSlop={8}
                      onPress={() => removePicked(file.uri)}
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {pickedDocs.map((file) => (
              <TouchableOpacity
                key={file.uri}
                style={styles.pickedDoc}
                onPress={() => openTicketFile({ file, localUri: file.uri })}
              >
                <FileBadge name={file.name} />
                <Text style={[styles.chipText, { flex: 1 }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.previewHint}>Xem</Text>
                <TouchableOpacity hitSlop={8} onPress={() => removePicked(file.uri)}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            <ImageView
              images={pickedImages.map((file) => ({ uri: file.uri }))}
              imageIndex={Math.max(previewIndex, 0)}
              visible={previewIndex >= 0}
              onRequestClose={() => setPreviewIndex(-1)}
              swipeToCloseEnabled
              doubleTapToZoomEnabled
            />

            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => pick("image")}>
                <Ionicons name="image-outline" size={20} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => pick("file")}>
                <Ionicons name="attach" size={20} color="#374151" />
              </TouchableOpacity>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Nhắn tin, gõ @ để nhắc tên…"
                placeholderTextColor="#9CA3AF"
                multiline
                style={styles.input}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!text.trim() && files.length === 0) && styles.sendDisabled]}
                disabled={isPending || (!text.trim() && files.length === 0)}
                onPress={send}
              >
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.closedBar, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
            <Text style={styles.closedText}>Ticket đã kết thúc, không gửi thêm tin nhắn được.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1A1D26" },
  headerSub: { fontSize: 12, color: "#6B7280" },
  list: { padding: 16, gap: 14, flexGrow: 1 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  event: {
    alignSelf: "center",
    backgroundColor: "#E9ECF1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: "90%",
  },
  eventText: { fontSize: 11, color: "#4B5563", textAlign: "center" },
  messageRow: { flexDirection: "row", gap: 8, maxWidth: "88%" },
  messageRowMine: { alignSelf: "flex-end" },
  messageCol: { flexShrink: 1, gap: 6 },
  who: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
  bubble: { paddingHorizontal: 12, paddingVertical: 10 },
  bubbleOther: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bubbleMine: {
    backgroundColor: TICKET_PRIMARY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bubbleText: { fontSize: 14, lineHeight: 20, color: "#1A1D26" },
  mention: { color: "#0052FF", fontWeight: "700" },
  time: { fontSize: 11, color: "#6B7280" },
  composer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  suggestions: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden" },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  suggestionName: { fontSize: 13, fontWeight: "600", color: "#1A1D26" },
  suggestionDept: { flex: 1, fontSize: 12, color: "#6B7280" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#374151", flexShrink: 1 },
  chipMention: { backgroundColor: "#EFF3FF" },
  previewRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 8, paddingTop: 6 },
  previewRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(17,24,39,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickedDoc: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewHint: { fontSize: 12, fontWeight: "700", color: "#E64A19" },
  chipMentionText: { fontSize: 12, fontWeight: "600", color: "#1D4ED8" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  iconBtn: {
    width: 40,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: "#111827",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: TICKET_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { backgroundColor: "#FDBA9E" },
  closedBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  closedText: { fontSize: 13, color: "#6B7280", textAlign: "center" },
});
