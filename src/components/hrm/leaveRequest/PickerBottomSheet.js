import React, { forwardRef, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../assets/theme/colors";

const PickerBottomSheet = forwardRef(({ title, items = [], value, onSelect }, ref) => {
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        <Text style={styles.title}>{title || "Chọn"}</Text>

        {items.map((item) => {
          const active = item.value === value;
          return (
            <TouchableOpacity
              key={String(item.value)}
              style={[styles.row, active && styles.rowActive]}
              activeOpacity={0.7}
              onPress={() => onSelect(item.value)}
            >
              <Text style={[styles.rowText, active && styles.rowTextActive]}>
                {item.label}
              </Text>
              {active && (
                <Ionicons name="checkmark" size={18} color={COLORS.Primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default PickerBottomSheet;

const styles = StyleSheet.create({
  handleIndicator: { backgroundColor: COLORS.neutral.neutral300, width: 40 },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.dark,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.neutral200,
  },
  list: { paddingHorizontal: 16 },
  listContent: { paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderRadius: 10,
  },
  rowActive: { backgroundColor: `${COLORS.Primary}0D` },
  rowText: { fontSize: 15, color: COLORS.text.dark },
  rowTextActive: { color: COLORS.Primary, fontWeight: "700" },
});
