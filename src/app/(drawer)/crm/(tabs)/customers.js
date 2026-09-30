import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { Menu, MoreVertical, User, Users, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import Header from "../../../../components/Header";
import AppSwitcherPill from "../../../../features/crm/components/AppSwitcherPill";
import { openDrawer } from "../../../../helpers/navigationRef";
import { canMgr } from "../../../../helpers/permissions";
import { CRM_COLORS, CRM_RADIUS } from "../../../../features/crm/theme/colors";
import { CustomerCallWorklistScreen } from "../../../../features/crmCustomerCall";
import { CustomerDirectoryScreen } from "../../../../features/crmCustomer";

const VIEW_MODE_OPTIONS = [
  { value: "mine", label: "Của tôi", icon: User },
  { value: "all", label: "Tất cả khách hàng", icon: Users },
];

const ViewModeMenu = ({ mode, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <TouchableOpacity style={styles.menuTrigger} onPress={() => setIsOpen(true)} activeOpacity={0.7}>
        <MoreVertical size={22} color={CRM_COLORS.textDark} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={[styles.dropdown, { top: insets.top + 56 }]}>
            {VIEW_MODE_OPTIONS.map((opt) => {
              const isSelected = opt.value === mode;
              const Icon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, isSelected && styles.optionActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <Icon size={16} color={isSelected ? CRM_COLORS.primary : "#6B7280"} />
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{opt.label}</Text>
                  {isSelected && <Check size={16} color={CRM_COLORS.primary} strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default function CustomersScreen() {
  const user = useSelector((state) => state.auth.user);
  const isManager = canMgr(user, "crm");

  const [viewMode, setViewMode] = useState("mine");
  const mode = isManager ? viewMode : "mine";

  return (
    <View style={styles.root}>
      <Header
        centerContent={<AppSwitcherPill />}
        LeftIcon={Menu}
        onLeftPress={() => openDrawer()}
        rightContent={isManager ? <ViewModeMenu mode={mode} onChange={setViewMode} /> : null}
      />

      {mode === "mine" ? <CustomerCallWorklistScreen /> : <CustomerDirectoryScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CRM_COLORS.background },
  menuTrigger: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1 },
  dropdown: {
    position: "absolute",
    right: 16,
    width: 220,
    backgroundColor: "#fff",
    borderRadius: CRM_RADIUS.lg,
    padding: 6,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: CRM_RADIUS.md,
  },
  optionActive: { backgroundColor: "#FFF3EE" },
  optionText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" },
  optionTextActive: { color: CRM_COLORS.primary, fontWeight: "800" },
});
