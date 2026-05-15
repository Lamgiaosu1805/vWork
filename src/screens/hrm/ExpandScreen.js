import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import Header from "../../components/Header";
import { openDrawer } from "../../helpers/navigationRef";

export default function ExpandScreen() {
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);
  const [adminExpanded, setAdminExpanded] = useState(false);

  const sections = useMemo(
    () => [
      {
        title: "Tổng quan",
        items: [
          {
            label: "Dashboard",
            icon: "grid-outline",
            onPress: () => navigation.navigate("DashboardHRMScreen"),
            isToggle: false,
          },
        ],
      },
      {
        title: "Nhân sự",
        items: [
          {
            label: "Nhân viên",
            icon: "person-outline",
            onPress: () => console.log("Navigate to Employees"),
            isToggle: false,
          },
          {
            label: "Chấm công",
            icon: "time-outline",
            onPress: () => navigation.navigate("AttendanceScreen"),
            isToggle: false,
          },
          {
            label: "Nghỉ phép",
            icon: "calendar-outline",
            onPress: () => console.log("Navigate to Leave"),
            isToggle: false,
          },
        ],
      },
      {
        title: "Tài chính",
        items: [
          {
            label: "Bảng lương",
            icon: "wallet-outline",
            onPress: () => console.log("Navigate to Payroll"),
            isToggle: false,
          },
        ],
      },
      {
        title: "Phân tích",
        items: [
          {
            label: "Báo cáo",
            icon: "bar-chart-outline",
            onPress: () => console.log("Navigate to Reports"),
            isToggle: false,
          },
          {
            label: "Sự kiện & Lịch",
            icon: "calendar-number-outline",
            onPress: () => console.log("Navigate to Events"),
            isToggle: false,
          },
        ],
      },
    ],
    [],
  );

  const adminItems = [
    {
      label: "Cài đặt",
      icon: "swap-horizontal-outline",
      onPress: () => console.log("Navigate to Setting"),
      isToggle: false,
    },
    {
      label: "Quản trị hệ thống",
      icon: "settings-outline",
      onPress: () => setAdminExpanded((prev) => !prev),
      isToggle: true,
    },
    {
      label: "Logs",
      icon: "receipt-outline",
      onPress: () => console.log("Navigate to Logs"),
      isToggle: false,
    },
    {
      label: "Trợ giúp & Tài liệu",
      icon: "help-circle-outline",
      onPress: () => console.log("Navigate to Help & Documentation"),
      isToggle: false,
    },
  ];

  const renderItem = (item, index, isNested = false) => (
    <TouchableOpacity
      key={`${item.label}-${index}`}
      activeOpacity={0.8}
      style={[styles.itemRow, isNested && styles.nestedItemRow]}
      onPress={item.onPress}
      disabled={!item.onPress}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconWrap, isNested && styles.iconWrapNested]}>
          <Ionicons name={item.icon} size={18} color="#004643" />
        </View>
        <Text style={[styles.itemText, isNested && styles.nestedItemText]}>
          {item.label}
        </Text>
      </View>
      {item.isToggle ? (
        <Ionicons
          name={adminExpanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#7C8A8B"
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#C7D2D3" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Mở rộng"
        leftIconName="menu"
        onLeftPress={() => {
          openDrawer();
        }}
        rightIconName="notifications"
        onRightPress={() => Alert.alert("Notifications Pressed")}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Danh sách chức năng</Text>
          <Text style={styles.heroSubtitle}>
            Khám phá nhanh các nhóm chức năng HRM.
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionBody}>
              {section.items.map((item, index) => renderItem(item, index))}
            </View>
          </View>
        ))}

        {user.role.includes("admin") && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Hệ thống</Text>
            <View style={styles.sectionBody}>
              {adminItems.map((item, index) => (
                <View key={item.label}>
                  {renderItem(item, index)}
                  {item.isToggle && adminExpanded ? (
                    <View style={styles.subMenu}>
                      {renderItem(
                        {
                          label: "Hồ sơ đính kèm",
                          icon: "document-text-outline",
                          onPress: () =>
                            console.log("Navigate to Document Attachments"),
                        },
                        0,
                        true,
                      )}
                      {renderItem(
                        {
                          label: "Vị trí / chức vụ",
                          icon: "briefcase-outline",
                          onPress: () =>
                            console.log("Navigate to Position Management"),
                        },
                        1,
                        true,
                      )}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FAF9",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heroCard: {
    marginTop: 16,
    backgroundColor: "#004643",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#D9F2EE",
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4F1EF",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F5C59",
    paddingHorizontal: 16,
    paddingBottom: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: "#ECF4F3",
  },
  itemRow: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F4F8F7",
  },
  nestedItemRow: {
    paddingLeft: 28,
    backgroundColor: "#FBFDFD",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2F1",
  },
  iconWrapNested: {
    backgroundColor: "#EAF7F5",
  },
  itemText: {
    marginLeft: 12,
    color: "#153C3A",
    fontSize: 15,
    fontWeight: "600",
  },
  nestedItemText: {
    fontWeight: "500",
    color: "#385A58",
  },
  subMenu: {
    backgroundColor: "#F8FCFB",
  },
});
