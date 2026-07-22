import { TouchableWithoutFeedback } from "react-native";
import { Keyboard } from "react-native";
import React from "react";

export const KeyboardAvoid = (props) => {
  const { children } = props;
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      {children}
    </TouchableWithoutFeedback>
  );
};
