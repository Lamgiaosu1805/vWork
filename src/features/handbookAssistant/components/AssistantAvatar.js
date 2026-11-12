import { Image } from "react-native";
import { Images } from "../../../assets/images";

// Ảnh VINNY nháy mắt hiện nguyên con (không cắt khung tròn); `size` là chiều cao.
const WINK_RATIO = 188 / 340;

const AssistantAvatar = ({ size = 32, style }) => (
  <Image
    source={Images.VinnyWink}
    style={[{ height: size, width: Math.round(size * WINK_RATIO) }, style]}
    resizeMode="contain"
    accessibilityIgnoresInvertColors
  />
);

export default AssistantAvatar;
