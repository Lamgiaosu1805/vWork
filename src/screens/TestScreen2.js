import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

export default function TestScreen2({navigation}) {
  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'yellow'}}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>Test Screen</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({})