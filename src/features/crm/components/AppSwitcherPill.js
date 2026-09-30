import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown, Check } from "lucide-react-native";
import { TikluyLogo, VnfiteLogo } from "./CompanyLogos";
import { useAppSwitcher } from "../context/AppSwitcherContext";

const PROJECTS = [
  { id: "VNFITE", name: "VNFITE", Logo: VnfiteLogo },
  { id: "TIKLUY", name: "TIKLUY", Logo: TikluyLogo },
];

const AppSwitcherPill = () => {
  const { selectedApp, setSelectedApp } = useAppSwitcher();
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const current = PROJECTS.find((p) => p.id === selectedApp) ?? PROJECTS[1];

  return (
    <View>
      <TouchableOpacity style={styles.trigger} activeOpacity={0.85} onPress={() => setIsOpen(true)}>
        <current.Logo size={18} />
        <Text style={styles.triggerText}>{current.name}</Text>
        <ChevronDown size={14} color="#FF5722" strokeWidth={3} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={[styles.dropdown, { top: insets.top + 64 }]}>
            {PROJECTS.map((project) => {
              const isSelected = project.id === selectedApp;
              return (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.option, isSelected && styles.optionActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedApp(project.id);
                    setIsOpen(false);
                  }}
                >
                  <View style={[styles.optionLogoWrap, isSelected && styles.optionLogoWrapActive]}>
                    <project.Logo size={22} />
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{project.name}</Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check size={13} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default AppSwitcherPill;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,87,34,0.6)",
    backgroundColor: "#FFF3EE",
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#E53935",
    letterSpacing: 0.5,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  dropdown: {
    position: "absolute",
    alignSelf: "center",
    left: "50%",
    marginLeft: -110,
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 8,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },
  optionActive: { backgroundColor: "#FFF3EE" },
  optionLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLogoWrapActive: { backgroundColor: "#fff" },
  optionText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#374151" },
  optionTextActive: { color: "#E53935", fontWeight: "900" },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF5722",
    alignItems: "center",
    justifyContent: "center",
  },
});
