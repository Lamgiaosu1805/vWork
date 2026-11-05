import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { Skeleton } from "../../components/Skeleton";
import {
  TICKET_PRIMARY,
  TICKET_YELLOW_COLORS,
  TICKET_YELLOW_REASON_LABELS,
} from "../../features/ticket/constants";
import useTicketDetail from "../../features/ticket/hooks/useTicketDetail";
import useTicketMeta from "../../features/ticket/hooks/useTicketMeta";
import useTicketActionRunner from "../../features/ticket/hooks/useTicketActionRunner";
import useRemoveTicketCollaborator from "../../features/ticket/hooks/useRemoveTicketCollaborator";
import { StatusPill, Tag, UrgencyPill } from "../../features/ticket/components/TicketBadges";
import TicketInfoTab from "../../features/ticket/components/detail/TicketInfoTab";
import TicketHistoryTab from "../../features/ticket/components/detail/TicketHistoryTab";
import TicketActionsMenu, {
  buildTicketMenu,
} from "../../features/ticket/components/actions/TicketActionsMenu";
import ResolveSheet from "../../features/ticket/components/actions/ResolveSheet";
import CloseSheet from "../../features/ticket/components/actions/CloseSheet";
import HoldSheet from "../../features/ticket/components/actions/HoldSheet";
import DueHintSheet from "../../features/ticket/components/actions/DueHintSheet";
import RequestInfoSheet from "../../features/ticket/components/actions/RequestInfoSheet";
import AssignSheet from "../../features/ticket/components/actions/AssignSheet";
import CollaboratorSheet from "../../features/ticket/components/actions/CollaboratorSheet";
import LinkTicketSheet from "../../features/ticket/components/actions/LinkTicketSheet";
import NoteActionSheet from "../../features/ticket/components/actions/NoteActionSheet";
import SubmitInfoSheet from "../../features/ticket/components/actions/SubmitInfoSheet";
import { useMyPermissions } from "../../features/permission";
import {
  allowedCapabilitiesOf,
  errorMessageOf,
  formatAgo,
  formatDateTime,
  formatShortDate,
} from "../../features/ticket/lib/ticketFormat";

const NOTE_SHEETS = ["release", "cancel", "reopen", "rejectApproval"];

// Nút chính ở thanh dưới: việc quan trọng nhất người xem đang làm được với ticket (theo capabilities)
const primaryActionOf = (can) => {
  if (can.claim) return { key: "claim", label: "Nhận xử lý", icon: "hand-left-outline" };
  if (can.submitInfo) return { key: "submitInfo", label: "Gửi bổ sung", icon: "cloud-upload-outline" };
  if (can.confirm) return { key: "confirm", label: "Xác nhận đã xong", icon: "checkmark-done" };
  if (can.resolve) return { key: "resolve", label: "Báo xử lý xong", icon: "checkmark" };
  if (can.resume) return { key: "resume", label: "Tiếp tục xử lý", icon: "play" };
  if (can.reopen) return { key: "reopen", label: "Mở lại ticket", icon: "refresh" };
  return null;
};

const DetailSkeleton = () => (
  <View style={{ padding: 16, gap: 10 }}>
    <View style={styles.box}>
      <Skeleton width={160} height={18} />
      <Skeleton width="90%" height={18} />
      <Skeleton width="60%" height={12} />
    </View>
    <View style={styles.box}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
    </View>
  </View>
);

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("info");
  const [menuVisible, setMenuVisible] = useState(false);
  const [sheet, setSheet] = useState(null);
  const sheetTimerRef = useRef(null);

  const { ticket: rawTicket, isLoading, isError, refetch, isRefetching } = useTicketDetail(id);
  const { meta } = useTicketMeta();
  const { canAny } = useMyPermissions();
  // Mọi nút / menu / sheet dùng capabilities đã lọc theo quyền thô của route (khớp web)
  const ticket = rawTicket
    ? { ...rawTicket, capabilities: allowedCapabilitiesOf(rawTicket, canAny) }
    : rawTicket;
  const { run, isPending } = useTicketActionRunner(ticket);
  const removeCollaborator = useRemoveTicketCollaborator(id);
  const employeeId = meta?.me?.employeeId;

  const closeSheet = () => setSheet(null);

  // Một Modal phải đóng hẳn rồi mới mở Modal khác, nếu không iOS bỏ qua Modal thứ hai
  const openFromMenu = (key) => {
    setMenuVisible(false);
    clearTimeout(sheetTimerRef.current);
    sheetTimerRef.current = setTimeout(() => handleAction(key), 350);
  };

  const runWithFeedback = async (action, body) => {
    const failure = await run(action, body);
    if (failure) Toast.show({ type: "error", text1: failure });
  };

  const handleAction = (key) => {
    if (key === "claim") {
      runWithFeedback("claim");
      return;
    }
    if (key === "resume") {
      runWithFeedback("resume");
      return;
    }
    if (key === "confirm") {
      Alert.alert(
      "Xác nhận đã xong",
      "Xác nhận yêu cầu đã được xử lý xong? Sau khi xác nhận ticket sẽ đóng và không mở lại được.",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Xác nhận", onPress: () => runWithFeedback("confirm") },
      ],
    );
      return;
    }
    setSheet(key);
  };

  const handleRemoveCollaborator = (person) => {
    Alert.alert("Bỏ người phối hợp", `Bỏ ${person.name} khỏi ticket này?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Bỏ",
        style: "destructive",
        onPress: async () => {
          try {
            await removeCollaborator.mutateAsync({ employeeId: person.id, version: ticket.version });
            Toast.show({ type: "success", text1: "Đã bỏ người phối hợp" });
          } catch (err) {
            Toast.show({ type: "error", text1: errorMessageOf(err) });
          }
        },
      },
    ]);
  };

  const handleVerifyApproval = (valid) => {
    if (!valid) {
      setSheet("rejectApproval");
      return;
    }
    Alert.alert("Tờ trình hợp lệ", "Xác nhận tờ trình đã nộp là hợp lệ?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Xác nhận", onPress: () => runWithFeedback("approval/verify", { valid: true }) },
    ]);
  };

  const openTicket = (ticketId) => router.push({ pathname: "/tickets/[id]", params: { id: ticketId } });

  const copyCode = async () => {
    await Clipboard.setStringAsync(ticket.code);
    Toast.show({ type: "success", text1: `Đã sao chép ${ticket.code}` });
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#1A1D26" />
      </TouchableOpacity>
      <View style={styles.headerTitle}>
        <Text style={styles.headerCode}>{ticket?.code ?? "Ticket"}</Text>
        {ticket?.code && (
          <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
            <Ionicons name="copy-outline" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
      {ticket?.capabilities ? (
        <TouchableOpacity style={styles.headerBtn} onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={22} color="#1A1D26" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        {header}
        <DetailSkeleton />
      </View>
    );
  }

  if (isError || !ticket) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color="#CBD5E0" />
          <Text style={styles.centerText}>Không tải được ticket hoặc bạn không có quyền xem</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Ticket hạn chế đã kết thúc: người tạo chỉ còn thấy thông tin chung
  if (ticket.accessLevel === "summary") {
    return (
      <View style={styles.root}>
        {header}
        <View style={{ padding: 16 }}>
          <View style={styles.box}>
            <StatusPill status={ticket.status} />
            <Text style={styles.title}>{ticket.title}</Text>
            {ticket.resolution && (
              <Text style={styles.body}>Kết quả: {ticket.resolution.label}</Text>
            )}
            <Text style={styles.muted}>
              Ticket hạn chế đã kết thúc, bạn chỉ xem được thông tin chung.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const can = ticket.capabilities ?? {};
  const primary = primaryActionOf(can);
  const menu = buildTicketMenu(ticket);
  const hasMenu = menu.working.length + menu.ending.length > 0;
  const tags = [ticket.product?.name, ticket.category?.name, ticket.template?.name].filter(Boolean);
  const pendingItems = (ticket.infoRequest?.items ?? []).filter((item) => !item.fulfilled);
  const isRequester = ticket.createdBy?.id === employeeId;
  const messageCount = ticket.messages?.length ?? 0;

  return (
    <View style={styles.root}>
      {header}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={TICKET_PRIMARY}
            colors={[TICKET_PRIMARY]}
          />
        }
      >
        <View style={styles.box}>
          <View style={styles.pillRow}>
            <StatusPill status={ticket.status} />
            <UrgencyPill urgency={ticket.urgency} />
            {ticket.restricted && <Ionicons name="lock-closed" size={14} color="#6B7280" />}
            <View style={{ flex: 1 }} />
            <Text style={[styles.muted, { flexShrink: 1 }]} numberOfLines={1}>
              {isRequester ? "Bạn tạo" : "Tạo"} · {formatDateTime(ticket.createdAt)}
            </Text>
          </View>
          <Text style={styles.title}>{ticket.title}</Text>
          {tags.length > 0 && (
            <View style={styles.tagRow}>
              {tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </View>
          )}
          {(ticket.yellow || ticket.dueHintAt) && (
            <View style={[styles.alertBar, !ticket.yellow && styles.alertBarPlain]}>
              <Ionicons
                name="time-outline"
                size={15}
                color={ticket.yellow ? TICKET_YELLOW_COLORS.color : "#6B7280"}
              />
              <Text
                style={[styles.alertText, !ticket.yellow && { color: "#4B5563" }]}
                numberOfLines={1}
              >
                {ticket.yellow
                  ? `${TICKET_YELLOW_REASON_LABELS[ticket.yellow.reason] ?? "Cần chú ý"}${
                      ticket.yellow.since ? ` · ${formatAgo(ticket.yellow.since)}` : ""
                    }`
                  : "Ngày dự kiến"}
              </Text>
              {ticket.dueHintAt && (
                <Text style={[styles.alertText, !ticket.yellow && { color: "#4B5563" }]}>
                  Dự kiến {formatShortDate(ticket.dueHintAt)}
                </Text>
              )}
            </View>
          )}
        </View>

        {can.confirm && (
          <View style={[styles.banner, styles.bannerSuccess]}>
            <Ionicons name="checkmark-circle" size={22} color="#15803D" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: "#14532D" }]}>
                Đã xử lý xong, chờ bạn xác nhận
              </Text>
              <Text style={[styles.bannerText, { color: "#166534" }]}>
                Kiểm tra lại rồi xác nhận, hoặc mở lại nếu chưa ổn.
                {ticket.autoCloseAt
                  ? ` Nếu bạn không phản hồi, hệ thống tự đóng vào ${formatShortDate(ticket.autoCloseAt)}.`
                  : ""}
              </Text>
            </View>
          </View>
        )}

        {ticket.status === "waiting_info" && pendingItems.length > 0 && (
          <View style={[styles.banner, styles.bannerWarning]}>
            <Ionicons name="document-text-outline" size={22} color="#B45309" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.bannerTitle, { color: "#78350F" }]}>
                {can.submitInfo ? "Cần bạn bổ sung" : "Đang chờ người tạo bổ sung"}
              </Text>
              {pendingItems.map((item) => (
                <Text key={item.key} style={[styles.bannerText, { color: "#92400E" }]}>
                  • {item.label}
                  {item.note ? ` – ${item.note}` : ""}
                </Text>
              ))}
              {!!ticket.infoRequest?.note && (
                <Text style={[styles.bannerText, { color: "#92400E", fontStyle: "italic" }]}>
                  “{ticket.infoRequest.note}”
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.segment}>
          {[
            { key: "info", label: "Thông tin" },
            { key: "history", label: "Lịch sử" },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.segmentItem, tab === item.key && styles.segmentActive]}
              onPress={() => setTab(item.key)}
            >
              <Text style={[styles.segmentText, tab === item.key && styles.segmentTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "info" ? (
          <TicketInfoTab
            ticket={ticket}
            onAddCollaborator={() => setSheet("collaborator")}
            onRemoveCollaborator={handleRemoveCollaborator}
            onVerifyApproval={handleVerifyApproval}
            onOpenTicket={openTicket}
          />
        ) : (
          <TicketHistoryTab activities={ticket.activities} />
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <TouchableOpacity
          style={styles.squareBtn}
          onPress={() => router.push({ pathname: "/tickets/messages", params: { id } })}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#374151" />
          {messageCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{messageCount > 99 ? "99+" : messageCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {hasMenu && (
          <TouchableOpacity style={styles.squareBtn} onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#374151" />
          </TouchableOpacity>
        )}
        {primary ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            disabled={isPending}
            onPress={() => handleAction(primary.key)}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name={primary.icon} size={20} color="#FFFFFF" />
                <Text style={styles.primaryText}>{primary.label}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.secondaryBtn]}
            onPress={() => router.push({ pathname: "/tickets/messages", params: { id } })}
          >
            <Text style={styles.secondaryText}>
              {can.message ? "Mở trao đổi" : "Ticket đã kết thúc"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TicketActionsMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        ticket={ticket}
        employeeId={employeeId}
        onSelect={openFromMenu}
      />
      <ResolveSheet visible={sheet === "resolve"} onClose={closeSheet} ticket={ticket} />
      <CloseSheet visible={sheet === "close"} onClose={closeSheet} ticket={ticket} meta={meta} />
      <HoldSheet visible={sheet === "hold"} onClose={closeSheet} ticket={ticket} />
      <DueHintSheet visible={sheet === "dueHint"} onClose={closeSheet} ticket={ticket} />
      <RequestInfoSheet
        visible={sheet === "requestInfo"}
        onClose={closeSheet}
        ticket={ticket}
        meta={meta}
      />
      <AssignSheet visible={sheet === "assign"} onClose={closeSheet} ticket={ticket} meta={meta} />
      <CollaboratorSheet visible={sheet === "collaborator"} onClose={closeSheet} ticket={ticket} />
      <LinkTicketSheet visible={sheet === "link"} onClose={closeSheet} ticket={ticket} />
      <SubmitInfoSheet
        visible={sheet === "submitInfo"}
        onClose={closeSheet}
        ticket={ticket}
        meta={meta}
      />
      <NoteActionSheet
        visible={NOTE_SHEETS.includes(sheet)}
        onClose={closeSheet}
        ticket={ticket}
        kind={NOTE_SHEETS.includes(sheet) ? sheet : "release"}
      />
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
  headerTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  headerCode: { fontSize: 16, fontWeight: "800", color: "#1A1D26" },
  copyBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#101828",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  pillRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 18, fontWeight: "800", lineHeight: 24, color: "#1A1D26" },
  body: { fontSize: 14, color: "#374151" },
  muted: { fontSize: 12, color: "#6B7280" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  alertBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: TICKET_YELLOW_COLORS.bg,
  },
  alertBarPlain: { backgroundColor: "#F3F4F6" },
  alertText: { fontSize: 12, fontWeight: "600", color: TICKET_YELLOW_COLORS.color, flexShrink: 1 },
  banner: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, borderWidth: 1 },
  bannerSuccess: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  bannerWarning: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  bannerTitle: { fontSize: 14, fontWeight: "800" },
  bannerText: { fontSize: 13, lineHeight: 19 },
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 12, backgroundColor: "#E9ECF1" },
  segmentItem: { flex: 1, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  segmentActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  segmentTextActive: { color: "#1A1D26" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  squareBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: TICKET_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: TICKET_PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: TICKET_PRIMARY,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 4,
  },
  primaryText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  secondaryBtn: { backgroundColor: "#F3F4F6", shadowOpacity: 0, elevation: 0 },
  secondaryText: { fontSize: 15, fontWeight: "700", color: "#374151" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: "#FFF3EE" },
  retryText: { fontSize: 13, fontWeight: "700", color: "#BF360C" },
});
