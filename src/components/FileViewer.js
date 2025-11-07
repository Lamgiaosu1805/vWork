import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import Pdf from 'react-native-pdf';
import utils from '../helpers/utils';

export default function FileViewer({ filename, extension, authToken }) {
  if (!filename) return <Text>Không có file đính kèm.</Text>;

  const fileUrl = `${utils.BASE_URL}/document/getFile?filename=${filename}`;
  const headers = { Authorization: `Bearer ${authToken}` };

  // 1️⃣ HIỂN THỊ ẢNH
  if (['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'].includes(extension)) {
    return (
      <Image
        source={{ uri: fileUrl, headers }}
        style={styles.image}
        resizeMode="contain"
      />
    );
  }

  // 2️⃣ HIỂN THỊ PDF
  if (extension.toLowerCase() === 'pdf') {
    return (
      <Pdf
        trustAllCerts={false}
        source={{ uri: fileUrl, cache: true, headers }}
        style={styles.pdf}
      />
    );
  }

  // 3️⃣ FILE KHÔNG HỖ TRỢ
  return (
    <Text style={styles.placeholder}>
      Loại file .{extension} không được hỗ trợ hiển thị trực tiếp.
    </Text>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 300,
  },
  pdf: {
    flex: 1,
  },
  placeholder: {
    padding: 20,
    textAlign: 'center',
    color: '#888',
  },
});
