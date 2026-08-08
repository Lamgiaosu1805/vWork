import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Header from "../../components/Header";
import { openDrawer } from "../../helpers/navigationRef";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import attendanceApi from "../../api/attendanceApi";
import WifiManager from "react-native-wifi-reborn";
import * as Location from "expo-location";
import { ensureLocationPermission } from "../../helpers/location";
import { getPeriodDates } from "../../helpers/payrollPeriod";
import useMyPayrollStats from "../../hooks/attendance/useMyPayrollStats";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import utils from "../../helpers/utils";
import {
  Bell,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  Menu,
} from "lucide-react-native";
import useTheme from "../../assets/theme/useTheme";
import { Images } from "../../assets/images";
import { COLORS } from "../../assets/theme/colors";

dayjs.locale("vi");

const capitalizeFirstLetter = (string) => {
  if (!string) return "";

  return string.charAt(0).toUpperCase() + string.slice(1);
};

const statusStyles = StyleSheet.create({
  statusBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statusTitle: {
    fontSize: 12,
    color: COLORS.text.bland,
    fontWeight: "500",
    marginTop: 8,
  },
  statusValue: {
    fontSize: 20,
    color: COLORS.neutral.neutral900,
    marginTop: 8,
    fontWeight: "700",
  },
});

const InlineStatusBox = ({ title, value, statusColor, icon: Icon }) => (
  <View style={statusStyles.statusBox}>
    <View
      style={[statusStyles.iconCircle, { backgroundColor: `${statusColor}1A` }]}
    >
      {Icon ? <Icon size={16} color={statusColor} /> : null}
    </View>
    <Text style={statusStyles.statusTitle}>{title}</Text>
    <Text style={statusStyles.statusValue}>{value}</Text>
  </View>
);

const calcWorkingHours = (ws) => {
  if (!ws?.check_in || !ws?.check_out) return "-:-";

  const checkIn = dayjs(ws.check_in);
  const checkOut = dayjs(ws.check_out);

  let totalMinutes = checkOut.diff(checkIn, "minute");

  // Điều kiện trừ nghỉ trưa:
  // - mergedShift = true
  // - checkout sau 1 giờ chiều
  if (ws?.mergedShift === true) {
    const lunchStart = checkIn.hour(12).minute(0).second(0);
    const lunchEnd = checkIn.hour(13).minute(0).second(0);

    // Nếu checkout sau 13:00 thì trừ 1 tiếng
    if (checkOut.isAfter(lunchEnd)) {
      totalMinutes -= 60;
    }
  }

  if (totalMinutes <= 0) return "-:-";

  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");

  return `${h}:${m}`;
};

const renderFullStatusSection = (currentWorkSheet) => (
  <View style={{ marginTop: 16 }}>
    <View
      style={{ flexDirection: "row", justifyContent: "space-between", gap: 11 }}
    >
      <InlineStatusBox
        title="Giờ vào"
        value={utils.formatTime(currentWorkSheet?.check_in, false) || "-:-"}
        statusColor={
          !currentWorkSheet?.check_in ? COLORS.error.error500 : "#00A896"
        }
        icon={LogIn}
      />
      <InlineStatusBox
        title="Giờ ra"
        value={utils.formatTime(currentWorkSheet?.check_out, false) || "-:-"}
        statusColor={
          !currentWorkSheet?.check_out ? COLORS.error.error500 : "#00A896"
        }
        icon={LogOut}
      />
      <InlineStatusBox
        title="Số giờ làm"
        value={calcWorkingHours(currentWorkSheet)}
        statusColor={COLORS.blue.blue500}
        icon={Clock}
      />
    </View>
  </View>
);

const TimeDisplay = ({ IMAGE_HEIGHT }) => {
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 30000);
    return () => clearInterval(timer);
  }, []);

  const timeDisplay = currentTime.format("HH:mm");
  const rawDateDisplay = currentTime.format("dddd DD/MM/YYYY");
  const dateDisplay = capitalizeFirstLetter(rawDateDisplay);

  return useMemo(
    () => (
      <View style={styles.timeCardShadowWrapper}>
        <LinearGradient
          colors={[COLORS.Primary, COLORS.Secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.timeAndImageContainer}
        >
          <View style={styles.timeInfo}>
            <Text style={styles.currentTimeText}>{timeDisplay}</Text>
            <Text style={styles.currentDateText}>{dateDisplay}</Text>
          </View>
          <View style={styles.illustrationWrapper}>
            <Image
              source={Images.DecoAttendance}
              style={{
                height: IMAGE_HEIGHT,
                width: null,
                aspectRatio: 178 / IMAGE_HEIGHT,
              }}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </View>
    ),
    [timeDisplay, dateDisplay, IMAGE_HEIGHT],
  );
};

const checkIn = async (dispatch) => {
  try {
    const granted = await ensureLocationPermission();
    if (!granted) return;
    const ssid = await WifiManager.getCurrentWifiSSID();
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    try {
      const data = await attendanceApi.checkIn({
        ssid: ssid,
        latitude,
        longitude,
      });
      Toast.show({
        type: "success",
        text1: "Thông báo",
        text2: data.data.message || "Chấm công thành công!",
      });
      await attendanceApi.getCurrentWorkSheet(dispatch);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Thông báo",
        text2: error.response?.data.message || error.message,
      });
      console.log("Check in error:", error.response?.data || error.message);
    }
  } catch (error) {
    console.log("Lỗi lấy SSID/Location:", error?.message || error);
    Alert.alert(
      "Quyền vị trí bị tắt",
      "Ứng dụng cần quyền truy cập vị trí để lấy vị trí hiện tại và tên Wi-Fi. Mở cài đặt để bật lại?",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Mở Cài đặt", onPress: () => Linking.openSettings() },
      ],
    );
  }
};

const PAGE_WINDOW = 24;
const PAGE_GUTTER = 8;

const buildPeriodOffsets = (count) =>
  Array.from({ length: count }, (_, i) => -(count - 1 - i));

const TimesheetMonthPage = ({ offset, width }) => {
  const { start, end } = useMemo(() => getPeriodDates(offset), [offset]);
  const month = end.month() + 1;
  const year = end.year();
  const { data, isLoading } = useMyPayrollStats(month, year);
  const summary = data?.summary ?? {};

  return (
    <View style={{ width, paddingHorizontal: PAGE_GUTTER }}>
      <Text
        style={{
          fontWeight: "500",
          fontSize: 16,
          color: COLORS.neutral.neutral700,
        }}
      >
        Kỳ {start.format("DD/MM")} – {end.format("DD/MM/YYYY")}
      </Text>

      <View style={{ marginTop: 16, flexDirection: "row" }}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.Tertiary,
            borderRadius: 16,
            paddingVertical: 18,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={styles.statMiniIconWrap}>
            <Ionicons name="calendar" size={26} color={COLORS.Primary} />
          </View>
          <Text
            style={{
              marginTop: 10,
              fontSize: 12,
              color: COLORS.neutral.neutral600,
            }}
          >
            Công chuẩn
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 20,
              color: COLORS.neutral.neutral800,
              fontWeight: "700",
            }}
          >
            {isLoading ? "—" : (summary.standard_work_units ?? 0)}
          </Text>
        </View>
        <View style={{ width: 24, backgroundColor: "white" }} />
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.Tertiary,
            borderRadius: 16,
            paddingVertical: 18,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={styles.statMiniIconWrap}>
            <Ionicons name="checkmark-done" size={26} color={COLORS.Primary} />
          </View>
          <Text
            style={{
              marginTop: 10,
              fontSize: 12,
              color: COLORS.neutral.neutral600,
            }}
          >
            Công thực tế
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 20,
              color: COLORS.neutral.neutral800,
              fontWeight: "700",
            }}
          >
            {isLoading ? "—" : (summary.work_unit_total ?? 0)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const IMAGE_HEIGHT = 199;

  const periodOffsets = useMemo(() => buildPeriodOffsets(PAGE_WINDOW), []);
  const [activeIndex, setActiveIndex] = useState(periodOffsets.length - 1);
  const [pageWidth, setPageWidth] = useState(0);
  const dispatch = useDispatch();

  const attendance = useSelector((state) => state.attendance);
  const { currentWorkSheet } = attendance;

  const activeOffset = periodOffsets[activeIndex] ?? 0;

  const handleMomentumScrollEnd = (e) => {
    if (!pageWidth) return;
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    const clamped = Math.max(0, Math.min(periodOffsets.length - 1, newIndex));
    setActiveIndex(clamped);
  };

  const disableCheckIn =
    currentWorkSheet?.check_in != null || currentWorkSheet?.check_out != null;

  return (
    <View style={[styles.container, { backgroundColor: colors.main }]}>
      <Header
        title="Chấm công"
        LeftIcon={Menu}
        onLeftPress={() => openDrawer()}
        RightIcon={Bell}
        onRightPress={() => navigation.navigate("Notification")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 25,
          paddingBottom: 30,
        }}
      >
        <TimeDisplay IMAGE_HEIGHT={IMAGE_HEIGHT} />

        <View style={styles.actionRow}>
          <TouchableOpacity
            disabled={disableCheckIn}
            style={[
              styles.checkButton,
              styles.checkInButton,
              disableCheckIn && styles.checkButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              checkIn(dispatch);
            }}
          >
            <View style={styles.checkButtonIconWrap}>
              <LogIn
                size={18}
                color={
                  disableCheckIn ? COLORS.neutral.neutral400 : COLORS.white
                }
              />
            </View>
            <Text
              style={[
                styles.checkButtonText,
                disableCheckIn && styles.checkButtonTextDisabled,
              ]}
            >
              CHECK IN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={currentWorkSheet?.check_out != null}
            style={[
              styles.checkButton,
              styles.checkOutButton,
              currentWorkSheet?.check_out != null &&
                styles.checkButtonOutlineDisabled,
            ]}
            activeOpacity={0.85}
            onPress={() => attendanceApi.checkOut(dispatch, currentWorkSheet)}
          >
            <View style={styles.checkButtonIconWrap}>
              <LogOut
                size={18}
                color={
                  currentWorkSheet?.check_out != null
                    ? COLORS.neutral.neutral400
                    : COLORS.Primary
                }
              />
            </View>
            <Text
              style={[
                styles.checkButtonText,
                styles.checkOutButtonText,
                currentWorkSheet?.check_out != null &&
                  styles.checkButtonTextDisabled,
              ]}
            >
              CHECK OUT
            </Text>
          </TouchableOpacity>
        </View>

        {renderFullStatusSection(currentWorkSheet)}

        <View style={{ marginTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 16, color: COLORS.black, fontWeight: "600" }}
            >
              Bảng công của tôi
            </Text>
            <Text style={styles.swipeHint}>Vuốt để xem kỳ khác</Text>
          </View>
          <View style={styles.timesheetCard}>
            <View onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
              {pageWidth > 0 && (
                <FlatList
                  data={periodOffsets}
                  keyExtractor={(offset) => String(offset)}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  initialScrollIndex={periodOffsets.length - 1}
                  getItemLayout={(_, index) => ({
                    length: pageWidth,
                    offset: pageWidth * index,
                    index,
                  })}
                  onMomentumScrollEnd={handleMomentumScrollEnd}
                  windowSize={3}
                  initialNumToRender={1}
                  maxToRenderPerBatch={1}
                  renderItem={({ item: offset }) => (
                    <TimesheetMonthPage offset={offset} width={pageWidth} />
                  )}
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.detailToggleBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("MyAttendanceDetailScreen", {
                  initialOffset: activeOffset,
                })
              }
            >
              <Text style={styles.detailToggleText}>Xem chi tiết</Text>
              <ChevronRight size={16} color={COLORS.blue.blue500} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  timeCardShadowWrapper: {
    marginTop: 13,
    borderRadius: 28,
    shadowColor: COLORS.Primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  timeAndImageContainer: {
    height: 150,
    width: "100%",
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  timeInfo: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingRight: 8,
    paddingLeft: 20,
  },
  currentTimeText: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 5,
  },
  currentDateText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  illustrationWrapper: { top: 199 * (8 / 199) },
  actionRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  checkButton: {
    flex: 1,
    height: 60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  checkInButton: { backgroundColor: COLORS.Primary },
  checkOutButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.Primary,
    shadowOpacity: 0.06,
  },
  checkButtonDisabled: {
    backgroundColor: COLORS.neutral.neutral200,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkButtonOutlineDisabled: {
    backgroundColor: COLORS.neutral.neutral100,
    borderColor: COLORS.neutral.neutral200,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkButtonIconWrap: { marginRight: 8 },
  checkButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  checkOutButtonText: { color: COLORS.Primary },
  checkButtonTextDisabled: { color: COLORS.neutral.neutral400 },
  timesheetCard: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  swipeHint: {
    fontSize: 11,
    color: COLORS.neutral.neutral400,
    fontStyle: "italic",
  },
  statMiniIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailToggleBtn: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: COLORS.blue.blue50,
  },
  detailToggleText: {
    fontSize: 14,
    color: COLORS.blue.blue500,
    fontWeight: "600",
  },
});
