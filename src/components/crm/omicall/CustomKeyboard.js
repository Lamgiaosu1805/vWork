import React, { memo, useCallback } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { UIImages } from "../../../assets/UIImages";
import { UIColors } from "../../../assets/colors/UIColors";

export const CustomKeyboard = memo((props) => {
  const { callback, title } = props;
  const keycapData = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "*",
    "0",
    "#",
  ];

  const _renderItem = useCallback(
    (data) => {
      const { item } = data;
      return (
        <TouchableOpacity
          style={{
            padding: 12,
          }}
          onPress={() => {
            callback(item);
          }}
        >
          <Text style={styles.keyCap}>{item}</Text>
        </TouchableOpacity>
      );
    },
    [callback],
  );

  return (
    <View style={styles.background}>
      <View style={styles.option}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        columnWrapperStyle={{ justifyContent: "space-around" }}
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
  option: {
    flexDirection: "row",
    paddingHorizontal: 40,
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    color: UIColors.textColor,
    fontWeight: "700",
    flexGrow: 1,
    textAlign: "center",
    marginLeft: 20,
  },
  keyCap: {
    fontSize: 24,
    color: UIColors.textColor,
  },
});
