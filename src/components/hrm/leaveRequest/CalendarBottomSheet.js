import React, { forwardRef, useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import MiniCalendar from "./MiniCalendar";
import { COLORS } from "../../../assets/theme/colors";

const CalendarBottomSheet = forwardRef(
  ({ title, selectedDate, onDayPress }, ref) => {
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
        <BottomSheetView style={styles.content}>
          {title ? <Text style={styles.title}>{title}</Text> : null}

          <MiniCalendar selectedDate={selectedDate} onDayPress={onDayPress} />
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default CalendarBottomSheet;

const styles = StyleSheet.create({
  handleIndicator: { backgroundColor: COLORS.neutral.neutral300, width: 40 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.dark,
    marginBottom: 12,
  },
});
