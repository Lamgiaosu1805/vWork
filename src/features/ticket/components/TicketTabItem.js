import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TicketTabItem = ({ item, counts, isSelected, onSelect }) => {
  const count = counts[item.value] || 0;
  const isYellow = item.value === "yellow";
  const isHighlighted = isYellow && count > 0;

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      style={[
        styles.container,
        isSelected
          ? styles.selected
          : isHighlighted
            ? styles.yellow
            : styles.default,
      ]}
    >
      <Text
        style={[
          styles.title,
          isSelected
            ? styles.selectedText
            : isHighlighted
              ? styles.yellowText
              : styles.defaultText,
        ]}
      >
        {item.title}
      </Text>

      {count > 0 && (
        <View
          style={[
            styles.badge,
            isSelected
              ? styles.selectedBadge
              : isYellow
                ? styles.yellowBadge
                : styles.defaultBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isSelected
                ? styles.selectedText
                : isYellow
                  ? styles.yellowText
                  : styles.defaultText,
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default TicketTabItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  selected: {
    backgroundColor: "#F16733",
    borderColor: "#F16733",
  },
  yellow: {
    backgroundColor: "#FEF9C3",
    borderColor: "#FACC15",
  },
  default: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },

  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  yellowText: {
    color: "#854D0E",
  },
  defaultText: {
    color: "#374151",
  },

  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  selectedBadge: {
    backgroundColor: "#FF8A65",
  },
  yellowBadge: {
    backgroundColor: "#FBBF24",
  },
  defaultBadge: {
    backgroundColor: "#F3F4F6",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
