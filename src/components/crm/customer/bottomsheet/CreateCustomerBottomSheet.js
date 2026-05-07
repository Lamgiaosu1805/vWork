import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import InputField from "../../InputField";
import BottomSheet from "../../BottomSheet";
import { Ionicons } from "@expo/vector-icons";
import { Easing, withTiming } from "react-native-reanimated";
import { HEIGHT_SHEET } from "../../../../screens/crm/CustomerScreen";
import validateForm from "../../../../utils/validateForm";

const CreateCustomerBottomSheet = ({ translateCreateCustomerY }) => {
  const [customer, setCustomer] = useState({
    fullName: "",
    identityId: "",
    phoneNumber: "",
    email: "",
    address: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    identityId: "",
    phoneNumber: "",
    email: "",
    address: "",
  });

  const handleClose = (isGesture) => {
    if (!isGesture) {
      translateCreateCustomerY.value = withTiming(HEIGHT_SHEET);
    }

    setCustomer({
      fullName: "",
      identityId: "",
      phoneNumber: "",
      email: "",
      address: "",
    });

    setErrors({
      fullName: "",
      identityId: "",
      phoneNumber: "",
      email: "",
      address: "",
    });

    Keyboard.dismiss();
  };

  const validate = () => {
    const newErrors = {
      fullName: "",
      identityId: "",
      phoneNumber: "",
      email: "",
      address: "",
    };

    if (!customer.fullName || customer.fullName.trim() === "") {
      newErrors.fullName = "Vui lòng nhập họ và tên";
    }

    if (customer.phoneNumber) {
      newErrors.phoneNumber = validateForm.validatePhoneNumber(
        customer.phoneNumber,
      );
    } else {
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại";
    }

    if (customer.email) {
      newErrors.email = validateForm.validateEmail(customer.email);
    } else {
      newErrors.email = "Vui lòng nhập email";
    }

    if (customer.identityId && customer.identityId.trim() !== "") {
      newErrors.identityId = validateForm.validateIdentityId(
        customer.identityId,
      );
    }

    setErrors(newErrors);

    return (
      !newErrors.fullName &&
      !newErrors.phoneNumber &&
      !newErrors.email &&
      !newErrors.identityId
    );
  };

  const handleSubmit = () => {
    if (validate()) {
      console.log("Form is valid", customer);
      handleClose(false);
    }
  };

  return (
    <BottomSheet onClose={handleClose} translateY={translateCreateCustomerY}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Tạo khách hàng mới</Text>

        <View style={styles.form}>
          <InputField
            label="Họ và tên*"
            placeholder="Nguyễn Văn A"
            value={customer.fullName}
            error={errors.fullName}
            onChangeValue={(value) =>
              setCustomer({ ...customer, fullName: value })
            }
          />

          <View style={styles.row}>
            <InputField
              label="CMND/CCCD"
              inputMode="numeric"
              maxLength={12}
              placeholder="123456789123"
              value={customer.identityId}
              error={errors.identityId}
              onChangeValue={(value) =>
                setCustomer({ ...customer, identityId: value })
              }
            />

            <InputField
              label="Số điện thoại*"
              inputMode="numeric"
              placeholder="0123456789"
              maxLength={10}
              value={customer.phoneNumber}
              error={errors.phoneNumber}
              onChangeValue={(value) =>
                setCustomer({ ...customer, phoneNumber: value })
              }
            />
          </View>

          <InputField
            label="Email*"
            placeholder="nguyenvana@gmail.com"
            value={customer.email}
            error={errors.email}
            onChangeValue={(value) =>
              setCustomer({ ...customer, email: value })
            }
          />

          <InputField
            label="Địa chỉ"
            placeholder="123 Đường ABC, Quận XYZ, Hà Nội"
            value={customer.address}
            onChangeValue={(value) =>
              setCustomer({ ...customer, address: value })
            }
          />

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => handleClose(false)}
              style={styles.btnCancel}
              activeOpacity={0.6}
            >
              <Text style={styles.textCancel}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.btnSubmit}
              activeOpacity={0.6}
            >
              <Text style={styles.textSubmit}>Tạo khách hàng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

export default CreateCustomerBottomSheet;

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    paddingBottom: 32,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginTop: 8,
  },

  form: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 36,
    gap: 14,
  },

  row: {
    flexDirection: "row",
    gap: 15,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    alignSelf: "flex-end",
    marginTop: 12,
  },

  btnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  textCancel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },

  btnSubmit: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#ED2E30",
  },

  textSubmit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
