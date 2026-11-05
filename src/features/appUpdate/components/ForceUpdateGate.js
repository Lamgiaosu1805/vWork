import React, { useEffect, useState } from "react";
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAppRelease from "../hooks/useAppRelease";
import { APP_VERSION } from "../lib/appVersion";
import { subscribeUpdateRequired } from "../lib/updateRequiredSignal";

const DISMISSED_KEY = "APP_UPDATE_DISMISSED_VERSION";
const PRIMARY = "#004643";

// Bản thấp hơn minVersion: màn chặn không đóng được, chỉ có nút mở store. Thấp hơn latestVersion: gợi ý, bấm
// "Để sau" thì không nhắc lại cho tới khi có bản mới hơn nữa. API lỗi / mất mạng → không hiện gì.
const ForceUpdateGate = () => {
  const { data } = useAppRelease();
  const [forced, setForced] = useState(null);
  const [dismissed, setDismissed] = useState(undefined);

  useEffect(() => subscribeUpdateRequired((release) => setForced(release)), []);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((value) => setDismissed(value))
      .catch(() => setDismissed(null));
  }, []);

  const required = forced ?? (data?.updateStatus === "required" ? data : null);
  const optional =
    !required && data?.updateStatus === "optional" && dismissed !== undefined && dismissed !== data.latestVersion
      ? data
      : null;
  const release = required ?? optional;

  if (!release) return null;

  const openStore = () => {
    if (release.storeUrl) Linking.openURL(release.storeUrl).catch(() => {});
  };

  const later = () => {
    setDismissed(release.latestVersion);
    AsyncStorage.setItem(DISMISSED_KEY, String(release.latestVersion)).catch(() => {});
  };

  const target = required ? release.minVersion : release.latestVersion;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={required ? () => {} : later}>
      <View style={[styles.overlay, required && styles.overlayForced]}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="cloud-download-outline" size={34} color={PRIMARY} />
          </View>
          <Text style={styles.title}>{required ? "Cần cập nhật phiên bản mới" : "Đã có phiên bản mới"}</Text>
          <Text style={styles.message}>
            {required
              ? release.message || "Phiên bản bạn đang dùng đã cũ. Vui lòng cập nhật để tiếp tục sử dụng vWork."
              : "Cập nhật để dùng các tính năng và bản sửa lỗi mới nhất."}
          </Text>
          {!!APP_VERSION && (
            <Text style={styles.version}>
              Phiên bản hiện tại {APP_VERSION}
              {target ? ` → ${target}` : ""}
            </Text>
          )}
          <TouchableOpacity style={styles.primary} activeOpacity={0.85} onPress={openStore}>
            <Text style={styles.primaryText}>Cập nhật ngay</Text>
          </TouchableOpacity>
          {!required && (
            <TouchableOpacity style={styles.secondary} onPress={later}>
              <Text style={styles.secondaryText}>Để sau</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ForceUpdateGate;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  overlayForced: { backgroundColor: "rgba(17,24,39,0.85)" },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E6F0EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1A1D26", textAlign: "center" },
  message: { fontSize: 14, color: "#4B5563", textAlign: "center", lineHeight: 20, marginTop: 8 },
  version: { fontSize: 12, color: "#9CA3AF", marginTop: 10 },
  primary: {
    alignSelf: "stretch",
    height: 48,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  secondary: { alignSelf: "stretch", height: 44, alignItems: "center", justifyContent: "center", marginTop: 6 },
  secondaryText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
});
