import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function SettingsScreen({ route }) {
  const [refCode, setRefCode] = useState(null);
  useEffect(() => {
    const init = async () => {
      const savedRef = await AsyncStorage.getItem("ref_code");

      setRefCode(route?.params?.ref || savedRef);
    };

    init();
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cài đặt</Text>
      <Text style={styles.desc}>Đây là màn hình Cài đặt để kiểm tra navigation và gesture.</Text>
      <Text>Ref: {refCode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#004643',
    marginBottom: 12,
  },
  desc: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
});
