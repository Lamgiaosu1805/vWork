import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthAvatar } from "../../../PostCard";
import { resolveDisplayName } from "../../../../hooks/workplace/useNicknameMap";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "../../../crm/BottomSheet";
import { HEIGHT_SHEET } from "../../../../screens/crm/CustomerScreen";
import { withTiming } from "react-native-reanimated";

function PickerRow({ member, nicknameMap, onPress }) {
  const displayName = resolveDisplayName(
    nicknameMap,
    member?._id,
    member?.full_name ?? "Thành viên",
  );
  const hasNickname = !!nicknameMap?.get(String(member?._id));

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <AuthAvatar
        filename={member?.avatar}
        name={displayName}
        size={42}
        cacheKey={member?.updatedAt}
      />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text
          style={[styles.rowSub, hasNickname && styles.rowSubActive]}
          numberOfLines={1}
        >
          {hasNickname ? member?.full_name : "Chưa có biệt danh"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

export default function NicknamePickerModal({
  translateY,
  members,
  nicknameMap,
  onSelect,
}) {
  const handleClose = (isGesture) => {
    if (!isGesture) {
      translateY.value = withTiming(HEIGHT_SHEET);
    }
  };

  return (
    <BottomSheet onClose={handleClose} translateY={translateY}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <SafeAreaView edges={["top"]} style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Chọn thành viên</Text>
                <TouchableOpacity
                  onPress={() => handleClose(false)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Chọn một người để đặt biệt danh</Text>

              <FlatList
                data={members ?? []}
                keyExtractor={(m, idx) => String(m?._id ?? idx)}
                renderItem={({ item }) => (
                  <PickerRow
                    member={item}
                    nicknameMap={nicknameMap}
                    onPress={() => onSelect(item)}
                  />
                )}
                contentContainerStyle={{ paddingBottom: 300 }}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Không có thành viên</Text>
                }
              />
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  hint: { fontSize: 12, color: "#9CA3AF", marginBottom: 8 },
  list: { marginTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13.5, fontWeight: "600", color: "#111827" },
  rowSub: { fontSize: 11.5, color: "#9CA3AF", marginTop: 1 },
  rowSubActive: { color: "#0F766E" },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 24,
  },
});
