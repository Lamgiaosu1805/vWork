import React, { memo, useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const CustomKeyboard = memo(({ callback }) => {
  const keycapData = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

  const _renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity style={styles.key} activeOpacity={0.7} onPress={() => callback(item)}>
        <Text style={styles.keyCap}>{item}</Text>
        {item === "0" && <Text style={styles.keySub}>+</Text>}
      </TouchableOpacity>
    ),
    [callback],
  );

  return (
    <View style={styles.background}>
      <FlatList
        columnWrapperStyle={styles.row}
        numColumns={3}
        data={keycapData}
        renderItem={_renderItem}
        keyExtractor={(item) => item}
        scrollEnabled={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  background: { width: "100%" },
  row: { justifyContent: "space-between", marginBottom: 14 },
  key: {
    width: "30%",
    height: 68,
    borderRadius: 20,
    backgroundColor: "#F4F6F9",
    alignItems: "center",
    justifyContent: "center",
  },
  keyCap: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1E293B",
  },
  keySub: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginTop: -2,
  },
});
