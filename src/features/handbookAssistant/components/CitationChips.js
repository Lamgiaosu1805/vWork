import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../../assets/theme/colors";
import { groupCitations } from "../lib/normalize";

// Expo Router chỉ truyền được string qua URL nên danh sách đoạn trích được JSON.stringify.
const openArticle = (group) =>
  router.push({
    pathname: "/handbook-assistant/article",
    params: {
      documentCode: group.documentCode,
      articleIdx: String(group.articleIdx),
      label: group.label,
      documentTitle: group.documentTitle ?? "",
      citedTexts: JSON.stringify(group.citedTexts),
    },
  });

const CitationChips = ({ citations }) => {
  const groups = groupCitations(citations);
  if (!groups.length) return null;
  return (
    <View style={styles.wrap}>
      {groups.map((g) => (
        <TouchableOpacity
          key={g.key}
          style={styles.chip}
          activeOpacity={0.7}
          onPress={() => openArticle(g)}
          accessibilityRole="button"
          accessibilityLabel={`Mở ${g.label}`}
        >
          <Ionicons name="book-outline" size={13} color={COLORS.Primary} />
          <Text style={styles.chipText} numberOfLines={1}>
            {g.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.Secondary,
    backgroundColor: "#FFF7F2",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.Primary, flexShrink: 1 },
});

export default CitationChips;
