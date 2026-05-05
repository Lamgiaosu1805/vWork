import { StyleSheet, Text, View } from "react-native";
import React, { useMemo } from "react";
import { LineChart } from "react-native-gifted-charts";
import { formatMonthLabel } from "../../../../utils/crmUtils";

const LineChartDashboard = ({ revenueChart = { labels: [], values: [] } }) => {
  const chartData = useMemo(() => {
    return revenueChart.values.map((v, i) => ({
      value: v,
      label: revenueChart.labels[i],
    }));
  }, [revenueChart]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Biểu đồ tổng tiền giao dịch</Text>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          height={220}
          spacing={50}
          dataPointsColor={"#ED2E30"}
          dataPointsRadius={6}
          color={"#ED2E30"}
          thickness={2}
          noOfSections={5}
          yAxisTextStyle={styles.yAxisText}
          xAxisLabelTextStyle={styles.xAxisText}
          xAxisLabelTexts={revenueChart.labels}
          pointerConfig={{
            pointerStripHeight: 220,
            pointerStripColor: "#ED2E30",
            pointerStripWidth: 1,
            strokeDashArray: [4, 4],
            pointerColor: "#ED2E30",
            radius: 6,
            pointerLabelWidth: 140,
            pointerLabelHeight: 60,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items) => {
              const item = items[0];
              return (
                <View style={styles.tooltipContainer}>
                  <Text style={styles.tooltipLabel}>
                    {formatMonthLabel(item.label)}
                  </Text>
                  <Text style={styles.tooltipValue}>
                    Doanh thu: {item.value.toLocaleString()} đ
                  </Text>
                </View>
              );
            },
          }}
        />

        <View style={styles.legendContainer}>
          <View style={styles.legendIconWrapper}>
            <View style={styles.legendLine} />
            <View style={styles.legendDot} />
          </View>

          <Text style={styles.legendText}>Doanh thu</Text>
        </View>
      </View>
    </View>
  );
};

export default LineChartDashboard;

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

  chartContainer: {
    alignSelf: "center",
  },

  yAxisText: {
    color: "#999",
    fontSize: 12,
    fontWeight: "500",
  },

  xAxisText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000",
  },

  tooltipContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minWidth: 130,
  },

  tooltipLabel: {
    color: "#000",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },

  tooltipValue: {
    color: "#ED2E30",
    fontSize: 12,
    fontWeight: "600",
  },

  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    alignSelf: "center",
  },

  legendIconWrapper: {
    alignItems: "center",
    height: 9,
    justifyContent: "center",
  },

  legendLine: {
    width: 23,
    height: 1,
    backgroundColor: "#ED2E30",
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: "#ED2E30",
    position: "absolute",
  },

  legendText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000",
  },
});
