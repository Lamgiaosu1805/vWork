import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { PhoneCall } from "lucide-react-native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { CRM_COLORS, CRM_RADIUS } from "../../crm/theme/colors";
import useUpdateRelationshipStatus from "../hooks/useUpdateRelationshipStatus";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const STATUS_LABELS = {
  chua_ekyc: "Chưa eKYC",
  ekyc_chua_dt: "eKYC chưa ĐT",
  dang_dau_tu: "Đang đầu tư",
  da_tat_toan: "Đã tất toán",
  khac: "Khác",
};

const RELATIONSHIP_OPTIONS = [
  { value: "not_friended", label: "Chưa kết bạn" },
  { value: "friended", label: "Đã kết bạn" },
  { value: "friended_no_response", label: "Kết bạn nhưng chưa phản hồi" },
];

const CustomerCallDetailSheet = ({ customer, onClose, onCallPress }) => {
  const sheetRef = useRef(null);
  const [localCustomer, setLocalCustomer] = useState(customer);
  const [relationshipStatus, setRelationshipStatus] = useState(customer?.relationshipStatus ?? "not_friended");
  const updateRelationshipStatusMutation = useUpdateRelationshipStatus();

  useEffect(() => {
    if (customer) {
      setLocalCustomer(customer);
      setRelationshipStatus(customer.relationshipStatus ?? "not_friended");
      sheetRef.current?.present();
    }
  }, [customer]);

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />,
    [],
  );

  const handleSelectStatus = (status) => {
    setRelationshipStatus(status);
    updateRelationshipStatusMutation.mutate({ id: localCustomer._id, status });
  };

  const handleCallPress = () => {
    onCallPress(localCustomer);
    sheetRef.current?.dismiss();
  };

  const renderFooter = useCallback(
    (props) => (
      <BottomSheetFooter {...props} style={styles.footer}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCallPress} activeOpacity={0.85}>
          <PhoneCall size={18} color="#fff" />
          <Text style={styles.callBtnText}>Gọi điện</Text>
        </TouchableOpacity>
      </BottomSheetFooter>
    ),
    [localCustomer],
  );

  const name = localCustomer?.identity?.full_name || localCustomer?.phone_number || "N/A";
  const callCount = localCustomer?.callCount ?? 0;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["55%"]}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      onDismiss={onClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      {!localCustomer ? null : (
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.phone}>{localCustomer.phone_number}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{STATUS_LABELS[localCustomer.derivedStatus] || localCustomer.derivedStatus}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => sheetRef.current?.dismiss()} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Tình trạng chăm sóc (Sale)</Text>
          <View style={styles.chipsRow}>
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, relationshipStatus === opt.value && styles.chipActive]}
                onPress={() => handleSelectStatus(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, relationshipStatus === opt.value && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Số lần gọi</Text>
              <View style={[styles.countBadge, callCount > 0 && styles.countBadgeActive]}>
                <Text style={[styles.countBadgeText, callCount > 0 && styles.countBadgeTextActive]}>
                  {callCount > 0 ? `${callCount} lần` : "Chưa gọi"}
                </Text>
              </View>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Liên hệ cuối</Text>
              <Text style={styles.gridValue}>{localCustomer.lastContactedAt ? dayjs(localCustomer.lastContactedAt).fromNow() : "Chưa liên hệ"}</Text>
            </View>
          </View>

          <View style={{ height: 90 }} />
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
};

export default CustomerCallDetailSheet;

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: "#fff", borderTopLeftRadius: CRM_RADIUS.xl, borderTopRightRadius: CRM_RADIUS.xl },
  handle: { backgroundColor: "#D1D5DB" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "flex-start", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingBottom: 16, marginBottom: 20 },
  name: { fontSize: 17, fontWeight: "800", color: "#111827" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  phone: { fontSize: 13, fontWeight: "700", color: "#4B5563" },
  badge: { borderWidth: 1, borderColor: "#FED7AA", backgroundColor: "#FFF3EE", paddingHorizontal: 8, paddingVertical: 2, borderRadius: CRM_RADIUS.pill },
  badgeText: { fontSize: 10, fontWeight: "700", color: CRM_COLORS.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 10 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: CRM_RADIUS.md, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: CRM_COLORS.accent, borderColor: CRM_COLORS.accent },
  chipText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  chipTextActive: { color: "#fff" },
  gridRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  gridCell: { flex: 1, padding: 14, backgroundColor: "#F9FAFB", borderRadius: CRM_RADIUS.md, borderWidth: 1, borderColor: "#F3F4F6" },
  gridLabel: { fontSize: 11, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  countBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: CRM_RADIUS.pill, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff" },
  countBadgeActive: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  countBadgeText: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  countBadgeTextActive: { color: "#047857" },
  gridValue: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  callBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2563EB", borderRadius: CRM_RADIUS.md, paddingVertical: 14 },
  callBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
