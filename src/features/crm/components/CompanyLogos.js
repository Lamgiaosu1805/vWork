import React from "react";
import { Image, View } from "react-native";
import { Icons } from "../../../assets/icons";

export const TikluyLogo = ({ size = 24 }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
    <Image source={Icons.IcTikluy} style={{ width: size, height: size }} resizeMode="cover" />
  </View>
);

export const VnfiteLogo = ({ size = 24 }) => (
  <Image source={Icons.IcApp} style={{ width: size, height: size }} resizeMode="contain" />
);
