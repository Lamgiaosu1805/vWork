import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const getPageItems = (current, total) => {
  const delta = 1;
  const rangeWithDots = [];

  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  if (left > 2) rangeWithDots.push(1, "...");
  else rangeWithDots.push(1);

  for (let i = left; i <= right; i++) rangeWithDots.push(i);

  if (right < total - 1) rangeWithDots.push("...", total);
  else if (total > 1) rangeWithDots.push(total);

  return rangeWithDots;
};

const Pagination = ({ current, total, onPrev, onNext, onPage, loading = false }) => {
  const items = getPageItems(current, total);
  const isDisabled = loading;

  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[
          styles.pageBtn,
          (current === 1 || isDisabled) && styles.pageBtnDisabled,
        ]}
        onPress={onPrev}
        disabled={current === 1 || isDisabled}
      >
        <Feather
          name="chevron-left"
          size={16}
          color={current === 1 || isDisabled ? "#D1D5DB" : "#374151"}
        />
        <Text
          style={[
            styles.pageBtnText,
            (current === 1 || isDisabled) && { color: "#D1D5DB" },
          ]}
        >
          Trước
        </Text>
      </TouchableOpacity>

      <View style={styles.pageNumbers}>
        {items.map((item, idx) =>
          item === "..." ? (
            <Text key={`dot-${idx}`} style={styles.pageDots}>
              ...
            </Text>
          ) : (
            <TouchableOpacity
              key={item}
              onPress={() => onPage(item)}
              style={[
                styles.pageNumWrap,
                item === current && styles.pageNumWrapActive,
              ]}
              disabled={isDisabled || item === current}
            >
              <Text
                style={[
                  styles.pageNum,
                  item === current && styles.pageNumActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.pageBtn,
          (current === total || isDisabled) && styles.pageBtnDisabled,
        ]}
        onPress={onNext}
        disabled={current === total || isDisabled}
      >
        <Text
          style={[
            styles.pageBtnText,
            (current === total || isDisabled) && { color: "#D1D5DB" },
          ]}
        >
          Kế tiếp
        </Text>
        <Feather
          name="chevron-right"
          size={16}
          color={current === total || isDisabled ? "#D1D5DB" : "#374151"}
        />
      </TouchableOpacity>
    </View>
  );
};

export default Pagination;

const styles = StyleSheet.create({
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  pageNumbers: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  pageNumWrap: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  pageNumWrapActive: {
    backgroundColor: "rgba(238, 64, 54, 0.08)",
  },
  pageNum: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  pageNumActive: {
    fontWeight: "700",
    color: "#EE4036",
  },
  pageDots: {
    fontSize: 14,
    color: "#9CA3AF",
    paddingHorizontal: 2,
    alignSelf: "center",
  },
});
