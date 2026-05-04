import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import {
  customerSegmentData,
  dashboardKpis,
  investmentTargetChart,
  revenueChart,
} from "../../../../mock/dataDashboardCRM";
import { formatMonthLabel } from "../../../../utils/crmUtils";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import LineChartDashboard from "./chart/LineChartDashboard";
import BarChartDashboard from "./chart/BarChartDashboard";
import PieChartDashboard from "./chart/PieChartDashboard";

const OverviewDashboard = () => {
  return (
    <View style={{ paddingHorizontal: 10, marginTop: 20 }}>
      <Text style={styles.title}>Tổng quan hệ thống</Text>
      <Text style={styles.subtitle}>Tổng quan về hoạt động kinh doanh</Text>

      {/* KPI */}
      <View style={styles.kpiContainer}>
        {dashboardKpis.map((item) => (
          <View key={item.id} style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>{item.title}</Text>
            <Text style={styles.kpiValue}>{item.value}</Text>

            <Text
              style={[
                styles.kpiChange,
                { color: item.positive ? "green" : "red" },
              ]}
            >
              {item.changeLabel}
            </Text>
          </View>
        ))}
      </View>

      {/* LINE CHART */}
      <LineChartDashboard revenueChart={revenueChart} />

      {/* BAR CHART */}
      <BarChartDashboard investmentTargetChart={investmentTargetChart} />

      {/* PIE CHART */}
      <PieChartDashboard customerSegmentData={customerSegmentData} />
    </View>
  );
};

export default OverviewDashboard;

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },

  kpiContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  kpiCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  kpiTitle: {
    fontSize: 14,
    color: "#888",
  },

  kpiValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 6,
  },

  kpiChange: {
    fontSize: 12,
  },
});
