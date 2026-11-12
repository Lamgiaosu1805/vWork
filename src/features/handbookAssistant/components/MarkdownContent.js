import { memo } from "react";
import { Linking, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import { COLORS } from "../../../assets/theme/colors";

const CARET = " ▍";

const openLink = (url) => {
  Linking.openURL(url).catch(() => {});
  return false;
};

const MarkdownContent = ({ content, streaming = false }) => (
  <Markdown style={markdownStyles} onLinkPress={openLink}>
    {streaming ? `${content}${CARET}` : content}
  </Markdown>
);

const TEXT = COLORS.neutral.neutral800;

const markdownStyles = StyleSheet.create({
  body: { color: TEXT, fontSize: 15, lineHeight: 22 },
  paragraph: { marginTop: 0, marginBottom: 8 },
  strong: { fontWeight: "700" },
  heading1: { fontSize: 18, fontWeight: "700", marginBottom: 6, color: TEXT },
  heading2: { fontSize: 17, fontWeight: "700", marginBottom: 6, color: TEXT },
  heading3: { fontSize: 16, fontWeight: "700", marginBottom: 4, color: TEXT },
  bullet_list: { marginBottom: 6 },
  ordered_list: { marginBottom: 6 },
  list_item: { marginBottom: 2 },
  link: { color: COLORS.Primary, textDecorationLine: "underline" },
  blockquote: {
    backgroundColor: COLORS.neutral.neutral100,
    borderLeftColor: COLORS.Primary,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  code_inline: { backgroundColor: COLORS.neutral.neutral100, borderRadius: 4, fontSize: 14 },
  table: { borderColor: COLORS.neutral.neutral300, borderWidth: 1, borderRadius: 4, marginBottom: 8 },
  th: { padding: 6, backgroundColor: COLORS.neutral.neutral100 },
  td: { padding: 6, borderColor: COLORS.neutral.neutral200 },
  hr: { backgroundColor: COLORS.neutral.neutral200, marginVertical: 8 },
});

export default memo(MarkdownContent);
