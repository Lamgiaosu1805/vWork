  import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
  import React, { useState } from "react";
  import { Ionicons } from "@expo/vector-icons";
  import { formatMoney } from "../../../utils/crmUtils";

  const STATUS_CONFIG = {
    0: {
      label: "Đang đầu tư",
      color: "#3B82F6",
    },
    1: {
      label: "Tất toán trước hạn",
      color: "#F59E0B",
    },
    2: {
      label: "Đã tất toán",
      color: "#16A34A",
    },
  };

  const getStatusConfig = (status) => {
    return (
      STATUS_CONFIG[Number(status)] || {
        label: "Chưa xác định",
        color: "info",
      }
    );
  };

  const formatPercent = (value) => {
    if (!value && value !== 0) return "---";

    return `${value}%`;
  };

  const InfoItem = ({ label, value }) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "---"}</Text>
    </View>
  );

  const InvestmentCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const status = getStatusConfig(item?.status);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(!expanded)}
        style={[
          styles.card,
          {
            borderLeftColor: status.color,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>
              {item?.investmentHoldingProduct || "---"}
            </Text>

            <Text style={styles.code}>{item?.investmentCode || "---"}</Text>

            {!expanded && (
              <Text style={styles.compactAmount}>
                {formatMoney(item?.investAmount)}
              </Text>
            )}
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <View
              style={[
                styles.statusBadge,
                {
                  borderColor: status.color,
                },
              ]}
            >
              <Text
                style={{
                  color: status.color,
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                {status.label}
              </Text>
            </View>

            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={22}
              color="#6B7280"
              style={{ marginTop: 8 }}
            />
          </View>
        </View>

        {expanded && (
          <>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Số tiền đầu tư</Text>

              <Text style={styles.amountValue}>
                {formatMoney(item?.investAmount)}
              </Text>
            </View>

            <View style={styles.grid}>
              <InfoItem
                label="Lãi suất"
                value={formatPercent(item?.interestRate)}
              />

              <InfoItem label="Kỳ hạn" value={item?.interestRatePeriod} />

              <InfoItem label="Ngày đầu tư" value={item?.startDate} />

              <InfoItem label="Ngày đáo hạn" value={item?.endDate} />
            </View>

            <View style={styles.footer}>
              <View>
                <Text style={styles.footerLabel}>Tiền thu về</Text>

                <Text style={styles.profitValue}>
                  {formatMoney(item?.totalProfit)}
                </Text>
              </View>

              <Text style={styles.maturity}>{item?.formOfMaturity || "---"}</Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  export default InvestmentCard;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      borderLeftWidth: 5,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      elevation: 3,
    },

    header: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    productName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111827",
    },

    code: {
      fontSize: 12,
      color: "#6B7280",
      marginTop: 4,
    },

    amountBox: {
      backgroundColor: "#F9FAFB",
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
      marginTop: 10,
    },

    amountLabel: {
      fontSize: 12,
      color: "#6B7280",
    },

    amountValue: {
      fontSize: 22,
      fontWeight: "800",
      color: "#111827",
      marginTop: 4,
    },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    infoItem: {
      width: "50%",
      marginBottom: 14,
    },

    infoLabel: {
      fontSize: 12,
      color: "#9CA3AF",
    },

    infoValue: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: "600",
      color: "#111827",
    },

    compactAmount: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: "700",
      color: "#111827",
    },

    statusBadge: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },

    footer: {
      borderTopWidth: 1,
      borderTopColor: "#F3F4F6",
      paddingTop: 14,

      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    footerLabel: {
      fontSize: 12,
      color: "#6B7280",
    },

    profitValue: {
      fontSize: 18,
      fontWeight: "800",
      color: "#16A34A",
      marginTop: 4,
    },

    maturity: {
      fontSize: 13,
      color: "#374151",
      maxWidth: 130,
      textAlign: "right",
    },
  });
