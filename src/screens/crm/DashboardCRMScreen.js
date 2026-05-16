import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { openDrawer } from "../../helpers/navigationRef";
import api from "../../api/axiosInstance";
import Header from "../../components/Header";
import OverviewDashboard from "../../components/crm/dashboard/OverviewDashboard";
import ViewShot from "react-native-view-shot";
import Share from "react-native-share";

dayjs.locale("vi");

const getGreeting = (fullName, sex) => {
  const h = new Date().getHours();
  const time    = h < 12 ? "buổi sáng" : h < 18 ? "buổi chiều" : "buổi tối";
  const pronoun = sex === 1 ? "anh" : sex === 2 ? "chị" : "bạn";
  const name    = fullName?.trim().split(/\s+/).pop() ?? "";
  return `Chào ${time}, ${pronoun} ${name}!`;
};

const { width } = Dimensions.get("window");

export default function DashboardCRMScreen() {
  const [dataQR, setDataQR] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);
  const viewShotRef = useRef(null);

  const handleShare = async () => {
    try {
      if (!dataQR) return;

      const filePath = await viewShotRef?.current?.capture?.();
      if (!filePath) return;

      const shareOptions = {
        title: "Chia sẻ mã QR giới thiệu",
        message: "Quét mã này để mở tài khoản và nhận ưu đãi!",
        url: `file://${filePath}`,
        type: "image/png",
      };
      await Share.open(shareOptions);
    } catch (error) {
      if (!error?.message?.includes("cancel")) {
        console.log("Share error:", error);
      }
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/user/getQRSale", { requiresAuth: true });
        setDataQR(res.data);
      } catch (error) {
        console.log("Error fetching Dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0055ba" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header
        title="CRM"
        leftIconName="menu"
        onLeftPress={() => openDrawer()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetingBox}>
          <Text style={styles.greetingTitle}>{getGreeting(user?.full_name, user?.sex)}</Text>
          <Text style={styles.greetingDate}>
            {dayjs().format("dddd, DD/MM/YYYY").replace(/^\w/, (c) => c.toUpperCase())} · CRM
          </Text>
        </View>

        {/* QR Section - Trọng tâm */}
        <View style={styles.qrCard}>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <View
              style={{
                backgroundColor: "#fff",
                alignItems: "center",
                paddingHorizontal: 25,
                paddingTop: 25,
                borderRadius: 20,
              }}
            >
              <Text style={styles.qrTitle}>
                Mã QR Giới Thiệu: {user?.phone_number + "-" + dataQR?.ma_nv}
              </Text>
              <Text style={styles.qrSubTitle}>
                Khách hàng quét mã để mở tài khoản
              </Text>

              <View style={styles.qrWrapper}>
                {dataQR?.landing_url ? (
                  <QRCode
                    value={dataQR.landing_url}
                    size={width * 0.6}
                    logoBackgroundColor="transparent"
                    color="#000"
                    backgroundColor="#fff"
                  />
                ) : null}
              </View>
            </View>
          </ViewShot>

          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Icon name="share-variant" size={20} color="#0055ba" />
            <Text style={styles.shareBtnText}>Chia sẻ liên kết</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: "#e3f2fd" }]}>
            <Icon name="account-group" size={24} color="#1976d2" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Khách hàng</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#f3e5f5" }]}>
            <Icon name="currency-usd" size={24} color="#7b1fa2" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Hợp đồng</Text>
          </View>
        </View>

        <OverviewDashboard />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  greetingBox: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  greetingTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  greetingDate: { fontSize: 13, color: "#6B7280", marginTop: 2, textTransform: "capitalize" },
  qrCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    paddingBottom: 25,
    alignItems: "center",
    marginTop: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  qrSubTitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 5,
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 15,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#0055ba",
  },
  shareBtnText: {
    color: "#0055ba",
    fontWeight: "600",
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    justifyContent: "space-between",
  },
  statBox: {
    width: "47%",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
});
