import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../assets/theme/colors";

const FULL_RATIO = 243 / 337;

// Nội dung đồng ý theo App Store 5.1.2(i). Đổi nội dung thì tăng CONSENT_VERSION trong constants.js.
const POINTS = [
  "Câu hỏi bạn nhập được gửi tới dịch vụ AI Claude của Anthropic (bên thứ ba) để tạo câu trả lời.",
  "Khi bạn hỏi về ngày phép của mình, số ngày phép còn lại của bạn cũng được gửi kèm để trả lời chính xác.",
  "Không gửi thông tin của đồng nghiệp khác. Lịch sử hội thoại được lưu trên hệ thống vWork tối đa 180 ngày và bạn có thể xoá bất cứ lúc nào.",
];

const ConsentCard = ({ onAccept, onDecline }) => (
  <ScrollView contentContainerStyle={styles.container}>
    <Image source={Images.VinnyFull} style={styles.hero} resizeMode="contain" />
    <Text style={styles.title}>Trước khi bắt đầu</Text>
    <Text style={styles.lead}>
      VINNY dùng trí tuệ nhân tạo để trả lời câu hỏi về nội quy và chính sách nhân sự.
    </Text>
    <View style={styles.points}>
      {POINTS.map((p) => (
        <View key={p} style={styles.point}>
          <View style={styles.dot} />
          <Text style={styles.pointText}>{p}</Text>
        </View>
      ))}
    </View>
    <TouchableOpacity style={styles.accept} onPress={onAccept} activeOpacity={0.85}>
      <Text style={styles.acceptText}>Đồng ý và tiếp tục</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.decline} onPress={onDecline} activeOpacity={0.7}>
      <Text style={styles.declineText}>Không, cảm ơn</Text>
    </TouchableOpacity>
  </ScrollView>
);

const HERO_H = 110;

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: "center" },
  hero: { height: HERO_H, width: Math.round(HERO_H * FULL_RATIO), marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.neutral.neutral800 },
  lead: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral.neutral600,
    textAlign: "center",
  },
  points: { alignSelf: "stretch", marginTop: 18, gap: 10 },
  point: { flexDirection: "row", gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.Primary, marginTop: 7 },
  pointText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.neutral.neutral700 },
  accept: {
    alignSelf: "stretch",
    marginTop: 24,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.Primary,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  decline: { marginTop: 8, paddingVertical: 10 },
  declineText: { color: COLORS.neutral.neutral500, fontSize: 14, fontWeight: "600" },
});

export default ConsentCard;
