import { useMemo, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../assets/theme/colors";
import { SUGGESTION_COUNT } from "../constants";
import { pickRandom } from "../lib/normalize";

const FULL_RATIO = 243 / 337;

const firstNameOf = (fullName) => (fullName ?? "").trim().split(/\s+/).pop() ?? "";

const EmptyState = ({ fullName, suggestions, quota, disabled, onPick }) => {
  // Bốc MỘT lần mỗi lần mở màn (seed giữ nguyên khi render lại / danh sách tải muộn).
  const [seed] = useState(() => Math.random());
  const picked = useMemo(() => pickRandom(suggestions, SUGGESTION_COUNT), [suggestions, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const outOfQuota = quota?.remaining === 0;
  const name = firstNameOf(fullName);

  return (
    <View style={styles.container}>
      <Image source={Images.VinnyFull} style={styles.hero} resizeMode="contain" />
      <Text style={styles.hello}>{name ? `Xin chào ${name}!` : "Xin chào!"}</Text>
      <Text style={styles.intro}>
        Mình là VINNY. Hỏi mình về nội quy, giờ làm, chấm công, nghỉ phép hay cách tạo đơn trên vWork nhé.
      </Text>

      <View style={styles.list}>
        {picked.map((q) => (
          <TouchableOpacity
            key={q}
            style={[styles.suggestion, (disabled || outOfQuota) && styles.disabled]}
            disabled={disabled || outOfQuota}
            onPress={() => onPick(q)}
            activeOpacity={0.75}
          >
            <Ionicons name="sparkles-outline" size={15} color={COLORS.Primary} />
            <Text style={styles.suggestionText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {quota && (
        <Text style={styles.quota}>
          {outOfQuota
            ? "Bạn đã dùng hết lượt hỏi hôm nay."
            : `Bạn còn ${quota.remaining}/${quota.limit} lượt hỏi hôm nay.`}
        </Text>
      )}
    </View>
  );
};

const HERO_H = 120;

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  hero: { height: HERO_H, width: Math.round(HERO_H * FULL_RATIO), marginBottom: 12 },
  hello: { fontSize: 20, fontWeight: "700", color: COLORS.neutral.neutral800 },
  intro: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral.neutral500,
    textAlign: "center",
  },
  list: { alignSelf: "stretch", marginTop: 18, gap: 8 },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neutral.neutral200,
    backgroundColor: COLORS.white,
  },
  suggestionText: { flex: 1, fontSize: 14, fontWeight: "500", color: COLORS.neutral.neutral700 },
  disabled: { opacity: 0.5 },
  quota: { marginTop: 16, fontSize: 12, color: COLORS.neutral.neutral500 },
});

export default EmptyState;
