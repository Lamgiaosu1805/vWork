import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import Header from "../../../components/Header";
import { openDrawer } from "../../../helpers/navigationRef";
import { getPermissions } from "../../../helpers/permissions";
import { Menu } from 'lucide-react-native';

const MenuItem = ({ icon, label, description, onPress, color = '#ED2E30' }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={styles.menuText}>
      <Text style={styles.menuLabel}>{label}</Text>
      {description && <Text style={styles.menuDesc}>{description}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
  </TouchableOpacity>
);

export default function ExpandScreen() {
  const user = useSelector(s => s.auth.user);
  const perms = getPermissions(user);
  console.log('ExpandScreen - perms:', perms);

  return (
    <View style={styles.container}>
      <Header
        title="Mở rộng"
        LeftIcon={Menu}
        onLeftPress={openDrawer}
      />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionLabel}>Nhân viên</Text>
        <View style={styles.group}>
          <MenuItem
            icon="people-outline"
            label="Cán bộ Nhân viên"
            description="Danh sách nhân viên trong phòng ban của bạn"
            onPress={() => router.push('/hrm/employee-list')}
            color="#2563EB"
          />
        </View>

        {perms.showDepartmentList && (
          <>
            <Text style={styles.sectionLabel}>Chấm công</Text>
            <View style={styles.group}>
              <MenuItem
                icon="clipboard-outline"
                label="Tình trạng chấm công"
                description="Xem tình trạng check-in toàn bộ CBNV"
                onPress={() => router.push('/hrm/attendance-overview')}
                color="#ED2E30"
              />
              {perms.isAdminRole && (
                <>
                  <View style={styles.divider} />
                  <MenuItem
                    icon="finger-print-outline"
                    label="Cấu hình chấm công"
                    description="Điểm WiFi và ca làm việc"
                    onPress={() => router.push('/hrm/attendance-config')}
                    color="#059669"
                  />
                </>
              )}
            </View>
          </>
        )}

        {perms.showDepartmentList && (
          <>
            <Text style={styles.sectionLabel}>Quản lý tổ chức</Text>
            <View style={styles.group}>
              <MenuItem
                icon="business"
                label="Chi nhánh"
                description="Danh sách và quản lý chi nhánh"
                onPress={() => router.push('/hrm/branch')}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="git-branch"
                label="Khối / Phòng ban"
                description="Cấu trúc tổ chức theo chi nhánh"
                onPress={() => router.push('/hrm/department')}
              />
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  menuDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 66 },
});
