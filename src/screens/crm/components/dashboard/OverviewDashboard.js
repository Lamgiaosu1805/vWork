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

const OverviewDashboard = () => {
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const pieRadius = 100;

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

  const getSliceAngle = (index) => {
    const total = customerSegmentData.reduce((sum, d) => sum + d.value, 0);
    let startAngle = -90; // bắt đầu từ trên
    for (let i = 0; i < index; i++) {
      startAngle += (customerSegmentData[i].value / total) * 360;
    }
    const sliceAngle = (customerSegmentData[index].value / total) * 360;
    return startAngle + sliceAngle / 2; // góc giữa slice
  };

  const handleSlicePress = (item, index) => {
    if (selectedSlice?.id === item.id) {
      setSelectedSlice(null);
      return;
    }
    const angleDeg = getSliceAngle(index);
    const angleRad = (angleDeg * Math.PI) / 180;
    const dist = pieRadius * 0.7; // khoảng cách từ tâm
    const x = dist * Math.cos(angleRad);
    const y = dist * Math.sin(angleRad);
    setTooltipPos({ x, y });
    setSelectedSlice(item);
  };

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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Biểu đồ tổng tiền giao dịch</Text>

        <View
          style={{
            alignSelf: "center",
          }}
        >
          <LineChart
            data={revenueChart.values.map((v, i) => ({
              value: v,
              label: revenueChart.labels[i],
            }))}
            height={220}
            spacing={50}
            dataPointsColor={"#ED2E30"}
            dataPointsRadius={6}
            color={"#ED2E30"}
            thickness={2}
            noOfSections={5}
            yAxisTextStyle={{
              color: "#999",
              fontSize: 12,
              fontWeight: "500",
            }}
            xAxisLabelTextStyle={{
              fontSize: 12,
              fontWeight: "500",
              color: "#000",
            }}
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
              autoAdjustPointerLabelPosition: true, // tự căn trái/phải tránh tràn
              pointerLabelComponent: (items) => {
                const item = items[0];
                return (
                  <View
                    style={{
                      backgroundColor: "#fff",
                      padding: 10,
                      borderRadius: 8,
                      elevation: 10,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      minWidth: 130,
                    }}
                  >
                    <Text
                      style={{
                        color: "#000",
                        fontSize: 12,
                        fontWeight: "500",
                        marginBottom: 4,
                      }}
                    >
                      {formatMonthLabel(item.label)}
                    </Text>
                    <Text
                      style={{
                        color: "#ED2E30",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Doanh thu: {item.value.toLocaleString()} đ
                    </Text>
                  </View>
                );
              },
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 12,
              alignSelf: "center",
            }}
          >
            <View
              style={{
                alignItems: "center",
                height: 9,
                justifyContent: "center",
              }}
            >
              <View
                style={{ width: 23, height: 1, backgroundColor: "#ED2E30" }}
              />

              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 9,
                  backgroundColor: "#ED2E30",
                  position: "absolute",
                }}
              />
            </View>

            <Text style={{ fontSize: 12, fontWeight: "500", color: "#000" }}>
              Doanh thu
            </Text>
          </View>
        </View>
      </View>

      {/* BAR CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Biểu đồ tài khoản đầu tư và mục tiêu
        </Text>

        <View
          style={{
            alignSelf: "center",
          }}
        >
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
            yAxisTextStyle={{
              fontSize: 12,
              fontWeight: "500",
              color: "#959595",
            }}
            xAxisLabelTextStyle={{
              fontSize: 12,
              fontWeight: "500",
              color: "#000",
            }}
            roundToDigits={0}
            xAxisThickness={0}
            yAxisThickness={0}
            renderTooltip={(item) => {
              const i = item.groupIndex;
              const total = investmentTargetChart.labels.length;

              // Tính % vị trí của bar trong chart
              const position = i / (total - 1); // 0 = trái, 1 = phải

              // Dịch chuyển tooltip: trái → sang phải, phải → sang trái
              let horizontalShift = -30; // mặc định giữa
              if (position < 0.25)
                horizontalShift = 0; // nhóm đầu → tooltip lệch phải
              else if (position > 0.75) horizontalShift = -70;

              const investment = investmentTargetChart.investment[i];
              const target = investmentTargetChart.target[i];
              const label = investmentTargetChart.labels[i];

              return (
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: 10,
                    borderRadius: 8,
                    minWidth: 120,
                    zIndex: 9999,
                    elevation: 10,
                    left: horizontalShift,
                  }}
                >
                  <Text
                    style={{
                      color: "#000000",
                      marginBottom: 4,
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    {formatMonthLabel(label)}
                  </Text>

                  <Text
                    style={{
                      color: "#ED2E30",
                      fontWeight: "500",
                      fontSize: 12,
                    }}
                  >
                    Đầu tư: {investment.toLocaleString()}
                  </Text>

                  <Text
                    style={{
                      color: "#3B82F6",
                      fontWeight: "500",
                      fontSize: 12,
                    }}
                  >
                    Mục tiêu: {target.toLocaleString()}
                  </Text>
                </View>
              );
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 22,
              alignSelf: "center",
              marginTop: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 17,
                  height: 17,
                  backgroundColor: "#ED2E30",
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "500", color: "#000" }}>
                Tài khoản đầu tư
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 17,
                  height: 17,
                  backgroundColor: "#3B82F6",
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "500", color: "#000" }}>
                Mục tiêu
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* PIE CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Phân loại khách hàng</Text>

        <View
          style={{
            alignSelf: "center",
          }}
        >
          <View
            style={{
              position: "relative",
              width: pieRadius * 2,
              height: pieRadius * 2,
            }}
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
              focusOnPress
              focusedPieRadius={110}
            />

            {selectedSlice && (
              <View
                style={{
                  position: "absolute",
                  top: pieRadius + tooltipPos.y - 20, // căn theo tâm
                  left: pieRadius + tooltipPos.x - 60, // căn theo tâm
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
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: selectedSlice.color,
                    marginBottom: 2,
                  }}
                >
                  {selectedSlice.value}%
                </Text>
                <Text style={{ fontSize: 11, color: "#333" }}>
                  {selectedSlice.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          {customerSegmentData.map((item) => (
            <Text key={item.id} style={{ color: item.color }}>
              ● {item.label}
            </Text>
          ))}
        </View>
      </View>
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
});
