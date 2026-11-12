import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import { useCustomAlert } from "../../components/CustomAlertProvider";
import { COLORS } from "../../assets/theme/colors";
import { ASSISTANT_SUBTITLE, ASSISTANT_TITLE } from "../../features/handbookAssistant/constants";
import AssistantAvatar from "../../features/handbookAssistant/components/AssistantAvatar";
import Composer from "../../features/handbookAssistant/components/Composer";
import ConsentCard from "../../features/handbookAssistant/components/ConsentCard";
import EmptyState from "../../features/handbookAssistant/components/EmptyState";
import MessageItem from "../../features/handbookAssistant/components/MessageItem";
import useCanUseHandbook from "../../features/handbookAssistant/hooks/useCanUseHandbook";
import useConversationMessages from "../../features/handbookAssistant/hooks/useConversationMessages";
import useHandbookConsent from "../../features/handbookAssistant/hooks/useHandbookConsent";
import useHandbookQuota from "../../features/handbookAssistant/hooks/useHandbookQuota";
import useHandbookSuggestions from "../../features/handbookAssistant/hooks/useHandbookSuggestions";
import useVinnyFloating from "../../features/handbookAssistant/hooks/useVinnyFloating";
import { askQuestion, cancelAnswer } from "../../features/handbookAssistant/lib/streamController";
import {
  conversationKeyOf,
  setInputDraft,
  setScreenOpen,
  startNewConversation,
} from "../../features/handbookAssistant/store/handbookAssistantSlice";

const EMPTY = [];
const LOCKED_CODES = ["CONVERSATION_LOCKED", "TURN_LIMIT"];
const keyOfMessage = (m) => m.id ?? `${m.clientId}:${m.role}`;

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/workplace"));

const Centered = ({ children }) => <View style={styles.centered}>{children}</View>;

const HandbookAssistantScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { showAlert } = useCustomAlert();
  const { canUse, isLoading: permissionLoading } = useCanUseHandbook();
  const consent = useHandbookConsent();
  const ready = canUse && consent.status === "granted";

  const fullName = useSelector((state) => state.auth.user?.full_name);
  const activeConversationId = useSelector((state) => state.handbookAssistant.activeConversationId);
  const conversationKey = conversationKeyOf(activeConversationId);
  const messages = useSelector(
    (state) => state.handbookAssistant.messagesByConversation[conversationKey] ?? EMPTY,
  );
  const streaming = useSelector((state) => state.handbookAssistant.streaming);
  const inputDraft = useSelector((state) => state.handbookAssistant.inputDraft);
  const { hidden: floatingHidden, setHidden: setFloatingHidden } = useVinnyFloating();

  const { quota } = useHandbookQuota(ready);
  const { suggestions } = useHandbookSuggestions(ready);
  const { isLoading, isError, refetch } = useConversationMessages(ready ? activeConversationId : null);

  useFocusEffect(
    useCallback(() => {
      dispatch(setScreenOpen(true));
      return () => dispatch(setScreenOpen(false));
    }, [dispatch]),
  );

  const reversed = useMemo(() => [...messages].reverse(), [messages]);
  const lastMessage = messages[messages.length - 1];
  const blocked = Boolean(lastMessage && LOCKED_CODES.includes(lastMessage.errorCode));

  const send = useCallback(
    (question) => {
      if (!question) return;
      dispatch(setInputDraft(""));
      askQuestion(question);
    },
    [dispatch],
  );

  const openMenu = () => {
    showAlert(
      "VINNY ở góc màn hình",
      floatingHidden
        ? "Hiện lại VINNY nổi ở góc màn hình để mở trợ lý nhanh?"
        : "Ẩn VINNY nổi ở góc màn hình? Bạn vẫn mở được trợ lý trong menu ☰.",
      { type: "confirmCancel", onConfirm: () => setFloatingHidden(!floatingHidden) },
    );
  };

  const renderItem = useCallback(
    ({ item }) => {
      const isLive =
        streaming &&
        item.role === "assistant" &&
        item.clientId === streaming.clientId &&
        (item.status === "pending" || item.status === "streaming");
      return (
        <MessageItem
          message={item}
          conversationKey={conversationKey}
          streamText={isLive ? streaming.text : undefined}
          resynced={isLive ? streaming.resynced : false}
          isStreaming={Boolean(streaming)}
          quota={quota}
        />
      );
    },
    [conversationKey, quota, streaming],
  );

  const headerRight = ready ? (
    <View style={styles.headerActions}>
      <TouchableOpacity
        onPress={() => router.push("/handbook-assistant/history")}
        hitSlop={8}
        accessibilityLabel="Lịch sử hội thoại"
      >
        <Ionicons name="time-outline" size={22} color={COLORS.text.dark} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => dispatch(startNewConversation())}
        hitSlop={8}
        accessibilityLabel="Hội thoại mới"
      >
        <Ionicons name="create-outline" size={22} color={COLORS.text.dark} />
      </TouchableOpacity>
      <TouchableOpacity onPress={openMenu} hitSlop={8} accessibilityLabel="Tuỳ chọn VINNY nổi">
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text.dark} />
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.headerActions} />
  );

  const title = (
    <View style={styles.titleWrap}>
      <AssistantAvatar size={34} />
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {ASSISTANT_TITLE}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {ASSISTANT_SUBTITLE}
        </Text>
      </View>
    </View>
  );

  let body;
  if (permissionLoading || (canUse && consent.status === "loading")) {
    body = (
      <Centered>
        <ActivityIndicator color={COLORS.Primary} />
      </Centered>
    );
  } else if (!canUse) {
    body = (
      <Centered>
        <Text style={styles.muted}>Bạn chưa được cấp quyền dùng Trợ lý Nội quy.</Text>
        <Text style={styles.muted}>Vui lòng liên hệ Phòng Hành chính - Nhân sự.</Text>
      </Centered>
    );
  } else if (consent.status === "needed") {
    body = <ConsentCard onAccept={consent.accept} onDecline={goBack} />;
  } else {
    let list;
    if (isLoading) {
      list = (
        <Centered>
          <ActivityIndicator color={COLORS.Primary} />
        </Centered>
      );
    } else if (isError) {
      list = (
        <Centered>
          <Text style={styles.muted}>Không tải được hội thoại.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </Centered>
      );
    } else if (!messages.length) {
      list = (
        <ScrollView keyboardShouldPersistTaps="handled">
          <EmptyState
            fullName={fullName}
            suggestions={suggestions}
            quota={quota}
            disabled={Boolean(streaming)}
            onPick={send}
          />
        </ScrollView>
      );
    } else {
      list = (
        <FlatList
          inverted
          data={reversed}
          keyExtractor={keyOfMessage}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      );
    }

    body = (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.flex}>{list}</View>
        <Composer
          value={inputDraft}
          onChangeText={(text) => dispatch(setInputDraft(text))}
          onSend={send}
          onStop={cancelAnswer}
          onNewConversation={() => dispatch(startNewConversation())}
          streaming={streaming}
          blocked={blocked}
          quota={quota}
          bottomInset={insets.bottom}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.screen}>
      <Header LeftIcon={ChevronLeft} onLeftPress={goBack} centerContent={title} rightContent={headerRight} />
      {body}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.neutral.neutral50 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 6 },
  muted: { fontSize: 14, color: COLORS.neutral.neutral500, textAlign: "center" },
  retry: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.Primary,
  },
  retryText: { color: COLORS.Primary, fontWeight: "600" },
  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: "100%" },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.Primary },
  subtitle: { fontSize: 11, color: COLORS.neutral.neutral500 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 14, minWidth: 40, justifyContent: "flex-end" },
});

export default HandbookAssistantScreen;
