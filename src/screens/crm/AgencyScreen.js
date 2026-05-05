import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import Header from "../../components/Header";
import { Ionicons } from "@expo/vector-icons";
import BranchCard from "../../components/crm/agency/BranchCard";
import StatCard from "../../components/crm/agency/StatCard";
import { formatRevenueCompact } from "../../utils/crmUtils";

export const branches = [
  {
    id: "1",
    name: "Chi nhánh Hà Nội",
    code: "CN-HN-01",
    city: "Hà Nội",
    address: "4B Vương Thừa Vũ, Hà Nội",
    revenue: 100000888000,
    manager: "Nguyễn Văn A",
    customers: "42 người",
    status: "active",
    createdAt: "01/05/2026",
  },
  {
    id: "2",
    name: "Chi nhánh Hải Phòng",
    code: "CN-HP-01",
    city: "Hải Phòng",
    address: "4B Vương Thừa Vũ, Hà Nội",
    revenue: 100000888000,
    manager: "Nguyễn Văn A",
    customers: "42 người",
    status: "inactive",
    createdAt: "01/05/2026",
  },
  {
    id: "3",
    name: "Chi nhánh HCM",
    code: "CN-HCM-01",
    city: "TP.HCM",
    address: "4B Vương Thừa Vũ, Hà Nội",
    revenue: 100000888000,
    manager: "Nguyễn Văn A",
    customers: "42 người",
    status: "active",
    createdAt: "01/05/2026",
  },
  {
    id: "4",
    name: "Chi nhánh Đà Nẵng",
    code: "CN-DN-01",
    city: "Đà Nẵng",
    address: "4B Vương Thừa Vũ, Hà Nội",
    revenue: 100000888000,
    manager: "Nguyễn Văn A",
    customers: "42 người",
    status: "active",
    createdAt: "01/05/2026",
  },
  {
    id: "5",
    name: "Chi nhánh Cần Thơ",
    code: "CN-CT-01",
    city: "Cần Thơ",
    address: "4B Vương Thừa Vũ, Hà Nội",
    revenue: 100000888000,
    manager: "Nguyễn Văn A",
    customers: "42 người",
    status: "active",
    createdAt: "01/05/2026",
  },
];

const AgencyScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState("");

  const handleView = (item) => {
    console.log("View:", item);
  };

  const handleEdit = (item) => {
    console.log("Edit:", item);
  };

  const handleDelete = (item) => {
    console.log("Delete:", item);
  };

  return (
    <View style={styles.container}>
      <Header
        leftIconName="chevron-back-outline"
        onLeftPress={() => navigation.goBack()}
        title="Quản lý Chi nhánh"
        rightIconName="add"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            label="Tổng chi nhánh"
            value="12"
            iconName="business"
            iconBgColor="#FEE2E2"
            color="#ED2E30"
          />
          <StatCard
            label="Đang hoạt động"
            value="4"
            iconName="code-working"
            iconBgColor="#DCFCE7"
            color="#22C55E"
          />
          <StatCard
            label="Tổng nhân viên"
            value="24"
            iconName="people-outline"
            iconBgColor="#DBEAFE"
            color="#3B82F6"
          />
          <StatCard
            label="Doanh thu"
            value={formatRevenueCompact(8420000000)}
            iconName="cash-outline"
            iconBgColor="#FEF9C3"
            color="#EAB308"
          />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#959595" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm chi nhánh"
            placeholderTextColor="#959595"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <FlatList
          data={branches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BranchCard
              item={item}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      </ScrollView>
    </View>
  );
};

export default AgencyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 6,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  listContainer: {
    paddingBottom: 30,
  },
});
