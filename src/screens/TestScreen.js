import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { openDrawer } from '../helpers/navigationRef'
import QRCode from "react-native-qrcode-svg";

export default function TestScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => openDrawer()}>
        <Text>Test Screen</Text>
        <QRCode
          value="vwork://register?ref=NV001"
          size={250}
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({})