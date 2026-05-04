import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { PieChart } from "react-native-gifted-charts";

const PieChartDashboard = ({ customerSegmentData }) => {
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const pieRadius = 100;

  const getSliceAngle = (index) => {
    const total = customerSegmentData.reduce((sum, d) => sum + d.value, 0);
    let startAngle = -90;
    for (let i = 0; i < index; i++) {
      startAngle += (customerSegmentData[i].value / total) * 360;
    }
    const sliceAngle = (customerSegmentData[index].value / total) * 360;
    return startAngle + sliceAngle / 2;
  };

  const handleSlicePress = (item, index) => {
    if (selectedSlice?.id === item.id) {
      setSelectedSlice(null);
      return;
    }
    const angleDeg = getSliceAngle(index);
    const angleRad = (angleDeg * Math.PI) / 180;
    const dist = pieRadius * 0.7;
    const x = dist * Math.cos(angleRad);
    const y = dist * Math.sin(angleRad);
    setTooltipPos({ x, y });
    setSelectedSlice(item);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Phân loại khách hàng</Text>

      <View style={styles.center}>
        <View
          style={[
            styles.pieWrapper,
            { width: pieRadius * 2, height: pieRadius * 2 },
          ]}
        >
          <PieChart
            data={customerSegmentData.map((item, index) => ({
              value: item.value,
              color: item.color,
              text: `${item.value}%`,
              onPress: () => handleSlicePress(item, index),
            }))}
            radius={pieRadius}
            textColor="white"
            textSize={14}
          />

          {selectedSlice && (
            <View
              style={[
                styles.tooltip,
                {
                  top: pieRadius + tooltipPos.y - 20,
                  left: pieRadius + tooltipPos.x - 60,
                },
              ]}
            >
              <Text
                style={[styles.tooltipValue, { color: selectedSlice.color }]}
              >
                {selectedSlice.value}%
              </Text>
              <Text style={styles.tooltipLabel}>{selectedSlice.label}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.legendContainer}>
        {customerSegmentData.map((item) => (
          <Text
            key={item.id}
            style={[styles.legendText, { color: item.color }]}
          >
            ● {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default PieChartDashboard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  center: {
    alignSelf: "center",
  },

  pieWrapper: {
    position: "relative",
  },

  tooltip: {
    position: "absolute",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minWidth: 120,
    zIndex: 9999,
  },

  tooltipValue: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },

  tooltipLabel: {
    fontSize: 11,
    color: "#333",
  },

  legendContainer: {
    marginTop: 16,
  },

  legendText: {
    fontSize: 12,
  },
});
