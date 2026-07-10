import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { AuthAvatar } from "../../PostCard";

const REACTION_CONFIG = {
  like: {
    emoji: "👍",
    label: "Thích",
    color: "#1877F2",
  },
  love: {
    emoji: "❤️",
    label: "Yêu thích",
    color: "#ED2E30",
  },
  haha: {
    emoji: "😆",
    label: "Haha",
    color: "#F7B928",
  },
  wow: {
    emoji: "😮",
    label: "Wow",
    color: "#F7B928",
  },
  sad: {
    emoji: "😢",
    label: "Buồn",
    color: "#F7B928",
  },
  angry: {
    emoji: "😡",
    label: "Phẫn nộ",
    color: "#E9710F",
  },
};

export default function ReactionModal({
  modalVisible,
  onClose,
  reactions = [],
}) {
  const [selected, setSelected] = useState("all");

  const { bottom } = useSafeAreaInsets();

  const tabs = useMemo(() => {
    const groups = {};

    reactions.forEach((r) => {
      groups[r.type] ??= [];
      groups[r.type].push(r);
    });

    return [
      {
        key: "all",
        emoji: "Tất cả",
        count: reactions.length,
      },
      ...Object.entries(groups).map(([type, items]) => ({
        key: type,
        emoji: REACTION_CONFIG[type].emoji,
        count: items.length,
      })),
    ];
  }, [reactions]);

  const data = useMemo(() => {
    if (selected === "all") return reactions;

    return reactions.filter((r) => r.type === selected);
  }, [selected, reactions]);

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.container, { paddingBottom: bottom + 12 }]}>
          <View style={styles.header}>
            <View style={{ width: 24 }} />

            <Text style={styles.title}>Cảm xúc</Text>

            <TouchableOpacity style={styles.close} onPress={onClose}>
              <X color="#FFF" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, selected === tab.key && styles.activeTab]}
                onPress={() => setSelected(tab.key)}
              >
                <Text style={styles.tabEmoji}>{tab.emoji}</Text>

                <Text>{tab.count}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={data}
            keyExtractor={(i) => i._id}
            renderItem={({ item }) => {
              const user = item.userId;
              return (
                <View style={styles.row}>
                  <View>
                    <AuthAvatar
                      filename={user.avatar}
                      name={user.full_name}
                      size={44}
                    />

                    <View style={styles.emoji}>
                      <Text>{REACTION_CONFIG[item.type].emoji}</Text>
                    </View>
                  </View>

                  <Text style={styles.name}>{user.full_name}</Text>
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000070",
    justifyContent: "flex-end",
  },

  container: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "70%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F766E",
  },

  close: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0F766E",
    justifyContent: "center",
    alignItems: "center",
  },

  tabs: {
    flexDirection: "row",
    marginTop: 18,
    marginBottom: 12,
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 10,
  },

  activeTab: {
    backgroundColor: "#DCFCE7",
  },

  tabEmoji: {
    marginRight: 6,
    fontSize: 18,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EEE",
  },
  row: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  emoji: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 2,
  },
});
