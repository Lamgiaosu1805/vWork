import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import Header from "../../components/Header";
import { useCustomAlert } from "../../components/CustomAlertProvider";
import { COLORS } from "../../assets/theme/colors";
import useDeleteHandbookConversation from "../../features/handbookAssistant/hooks/useDeleteHandbookConversation";
import useHandbookConversations from "../../features/handbookAssistant/hooks/useHandbookConversations";
import { selectConversation } from "../../features/handbookAssistant/store/handbookAssistantSlice";

dayjs.extend(relativeTime);

const HandbookHistoryScreen = () => {
  const dispatch = useDispatch();
  const { showAlert } = useCustomAlert();
  const activeConversationId = useSelector((state) => state.handbookAssistant.activeConversationId);
  const streamingKey = useSelector((state) => state.handbookAssistant.streaming?.conversationKey);
  const { conversations, isLoading, isError, refetch, isRefetching } = useHandbookConversations();
  const deleteConversation = useDeleteHandbookConversation();

  const open = (id) => {
    dispatch(selectConversation(id));
    router.back();
  };

  const confirmDelete = (conversation) =>
    showAlert("Xoá hội thoại", `Xoá vĩnh viễn "${conversation.title}"? Không thể khôi phục.`, {
      type: "confirmCancel",
      onConfirm: () => deleteConversation.mutate(conversation.id),
    });

  const renderItem = ({ item }) => {
    const isActive = item.id === activeConversationId;
    const isStreaming = item.id === streamingKey;
    return (
      <TouchableOpacity
        style={[styles.item, isActive && styles.itemActive]}
        onPress={() => open(item.id)}
        activeOpacity={0.75}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={18}
          color={isActive ? COLORS.Primary : COLORS.neutral.neutral500}
        />
        <View style={styles.itemBody}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.itemTime}>
            {isStreaming ? "Đang trả lời…" : dayjs(item.updatedAt).locale("vi").fromNow()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmDelete(item)}
          disabled={isStreaming || deleteConversation.isPending}
          hitSlop={8}
          accessibilityLabel="Xoá hội thoại"
          style={isStreaming && styles.disabled}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.neutral.neutral400} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  let body;
  if (isLoading) {
    body = (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.Primary} />
      </View>
    );
  } else if (isError) {
    body = (
      <View style={styles.centered}>
        <Text style={styles.muted}>Không tải được lịch sử.</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retry}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.muted}>Chưa có hội thoại nào.</Text>
          </View>
        }
      />
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="Lịch sử hội thoại" LeftIcon={ChevronLeft} onLeftPress={() => router.back()} />
      {body}
      <Text style={styles.footnote}>Hội thoại không dùng tới sẽ tự xoá sau 180 ngày.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.neutral.neutral50 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  muted: { fontSize: 14, color: COLORS.neutral.neutral500 },
  retry: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.Primary },
  retryText: { color: COLORS.Primary, fontWeight: "600" },
  list: { padding: 12, flexGrow: 1 },
  separator: { height: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutral.neutral200,
  },
  itemActive: { borderColor: COLORS.Primary, backgroundColor: "#FFF7F2" },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: COLORS.neutral.neutral800 },
  itemTime: { fontSize: 12, color: COLORS.neutral.neutral500 },
  disabled: { opacity: 0.3 },
  footnote: { fontSize: 11, color: COLORS.neutral.neutral400, textAlign: "center", paddingBottom: 24 },
});

export default HandbookHistoryScreen;
