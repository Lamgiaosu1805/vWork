import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { BarChart } from "react-native-gifted-charts";
import { formatMonthLabel } from "../../../../../utils/crmUtils";

const BarChartDashboard = ({ investmentTargetChart }) => {
  const dataBarChart = investmentTargetChart.labels.flatMap((label, index) => [
    {
      value: investmentTargetChart.investment[index],
      frontColor: "#ED2E30",
      label,
      groupIndex: index,
      spacing: 4,
      type: "investment",
    },
    {
      value: investmentTargetChart.target[index],
      frontColor: "#3B82F6",
      label: "",
      groupIndex: index,
      type: "target",
    },
  ]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Biểu đồ tài khoản đầu tư và mục tiêu</Text>

      <View style={styles.chartContainer}>
        <BarChart
          data={dataBarChart}
          height={280}
          overflowTop={76}
          barWidth={16}
          spacing={16}
          labelWidth={40}
          yAxisExtraHeight={32}
          showFractionalValues
          noOfSections={5}
          barBorderRadius={4}
          frontColor="lightgray"
          showYAxisIndices
          yAxisTextStyle={styles.yAxisText}
          xAxisLabelTextStyle={styles.xAxisText}
          roundToDigits={0}
          xAxisThickness={0}
          yAxisThickness={0}
          renderTooltip={(item) => {
            const i = item.groupIndex;
            const total = investmentTargetChart.labels.length;

            const position = i / (total - 1);

            let horizontalShift = -30;
            if (position < 0.25) horizontalShift = 0;
            else if (position > 0.75) horizontalShift = -70;

            const investment = investmentTargetChart.investment[i];
            const target = investmentTargetChart.target[i];
            const label = investmentTargetChart.labels[i];

            return (
              <View
                style={[styles.tooltipContainer, { left: horizontalShift }]}
              >
                <Text style={styles.tooltipLabel}>
                  {formatMonthLabel(label)}
                </Text>

                <Text style={styles.investmentText}>
                  Đầu tư: {investment.toLocaleString()}
                </Text>

                <Text style={styles.targetText}>
                  Mục tiêu: {target.toLocaleString()}
                </Text>
              </View>
            );
          }}
        />

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.investmentBox]} />
            <Text style={styles.legendText}>Tài khoản đầu tư</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.targetBox]} />
            <Text style={styles.legendText}>Mục tiêu</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BarChartDashboard;

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
    fontSize: 12,
    fontWeight: "500",
    color: "#959595",
  },

  xAxisText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000",
  },

  tooltipContainer: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    minWidth: 120,
    zIndex: 9999,
    elevation: 10,
    position: "absolute",
  },

  tooltipLabel: {
    color: "#000000",
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "500",
  },

  investmentText: {
    color: "#ED2E30",
    fontWeight: "500",
    fontSize: 12,
  },

  targetText: {
    color: "#3B82F6",
    fontWeight: "500",
    fontSize: 12,
  },

  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    alignSelf: "center",
    marginTop: 12,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendBox: {
    width: 17,
    height: 17,
  },

  investmentBox: {
    backgroundColor: "#ED2E30",
  },

  targetBox: {
    backgroundColor: "#3B82F6",
  },

  legendText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000",
  },
});
