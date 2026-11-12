import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../assets/theme/colors";
import useHandbookArticle from "../../features/handbookAssistant/hooks/useHandbookArticle";
import { splitHighlights } from "../../features/handbookAssistant/lib/normalize";

const parseQuotes = (raw) => {
  try {
    const value = JSON.parse(raw ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// Màn dạng modal: nguyên văn điều khoản được trích dẫn, tô vàng đoạn khớp.
const HandbookArticleScreen = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const quotes = useMemo(() => parseQuotes(params.citedTexts), [params.citedTexts]);
  const { article, isLoading, isError, refetch } = useHandbookArticle(params.documentCode, params.articleIdx);

  const content = article?.content ?? "";
  const parts = useMemo(() => (content ? splitHighlights(content, quotes) : null), [content, quotes]);

  let body;
  if (isLoading) {
    body = <ActivityIndicator color={COLORS.Primary} style={{ marginTop: 32 }} />;
  } else if (isError || !article) {
    body = (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>Không tải được nội dung điều khoản.</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retry}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    body = (
      <>
        {!parts && quotes.length > 0 && (
          <View style={styles.quotes}>
            <Text style={styles.quotesLabel}>Đoạn được trích dẫn</Text>
            {quotes.map((q) => (
              <View key={q} style={styles.quote}>
                <Ionicons name="chatbox-ellipses-outline" size={14} color={COLORS.neutral.neutral500} />
                <Text style={styles.quoteText}>{q}</Text>
              </View>
            ))}
          </View>
        )}
        {article.title ? <Text style={styles.articleTitle}>{article.title}</Text> : null}
        <Text style={styles.content}>
          {parts
            ? parts.map((p, i) => (
                // eslint-disable-next-line react/no-array-index-key -- các đoạn cố định theo nội dung
                <Text key={i} style={p.mark ? styles.mark : null}>
                  {p.text}
                </Text>
              ))
            : content}
        </Text>
      </>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Ionicons name="book-outline" size={20} color={COLORS.Primary} />
        <View style={styles.headerText}>
          <Text style={styles.label} numberOfLines={2}>
            {params.label}
          </Text>
          {params.documentTitle ? (
            <Text style={styles.docTitle} numberOfLines={1}>
              {params.documentTitle}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityLabel="Đóng">
          <Ionicons name="close" size={24} color={COLORS.text.dark} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        {body}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.neutral.neutral300,
  },
  headerText: { flex: 1 },
  label: { fontSize: 15, fontWeight: "700", color: COLORS.neutral.neutral800 },
  docTitle: { fontSize: 12, color: COLORS.neutral.neutral500, marginTop: 2 },
  body: { padding: 16 },
  articleTitle: { fontSize: 16, fontWeight: "700", color: COLORS.neutral.neutral800, marginBottom: 8 },
  content: { fontSize: 15, lineHeight: 24, color: COLORS.neutral.neutral700 },
  mark: { backgroundColor: "rgba(255, 196, 0, 0.35)", color: COLORS.neutral.neutral900 },
  quotes: { marginBottom: 16, gap: 6 },
  quotesLabel: { fontSize: 12, fontWeight: "700", color: COLORS.neutral.neutral500 },
  quote: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255, 196, 0, 0.14)",
  },
  quoteText: { flex: 1, fontSize: 14, fontStyle: "italic", color: COLORS.neutral.neutral700 },
  errorBox: { alignItems: "center", gap: 8, marginTop: 32 },
  errorText: { fontSize: 14, color: COLORS.neutral.neutral500 },
  retry: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.Primary },
  retryText: { color: COLORS.Primary, fontWeight: "600" },
});

export default HandbookArticleScreen;
