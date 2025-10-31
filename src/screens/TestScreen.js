import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { openDrawer } from '../helpers/navigationRef'

export default function TestScreen({navigation}) {
  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
      <TouchableOpacity onPress={() => openDrawer()}>
        <Text>Test Screen</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({})