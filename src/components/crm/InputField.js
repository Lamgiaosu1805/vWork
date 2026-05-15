import { StyleSheet, Text, TextInput, View } from "react-native";
import React from "react";
import { Dropdown } from "react-native-element-dropdown";

const InputField = ({
  label,
  placeholder,
  colorPlaceholder = "#959595",
  containerStyle,
  isDropdown = false,
  value,
  maxLength,
  onChangeValue,
  inputMode,
  keyboardType,
  dataDropdown = [{ value: "", label: "" }],
  error = "",
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      {isDropdown ? (
        <Dropdown
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          selectedTextStyle={styles.dropdownText}
          itemTextStyle={styles.dropdownText}
          iconStyle={styles.icon}
          data={dataDropdown}
          labelField="label"
          valueField="value"
          value={value}
          placeholder={placeholder}
          onChange={(item) => onChangeValue(item.value)}
        />
      ) : (
        <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
          <TextInput
            keyboardType={keyboardType}
            inputMode={inputMode}
            placeholder={placeholder}
            placeholderTextColor={colorPlaceholder}
            style={styles.input}
            maxLength={maxLength}
            value={value}
            onChangeText={onChangeValue}
          />
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 6,
    minHeight: 80,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },

  inputWrapper: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 50,
    justifyContent: "center",
  },

  input: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    paddingVertical: 8,
  },

  dropdown: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    minHeight: 40,
    justifyContent: "center",
  },

  dropdownContainer: {
    borderRadius: 8,
  },

  dropdownText: {
    fontSize: 12,
    color: "#333333",
  },

  icon: {
    width: 14,
    height: 14,
  },

  inputWrapperError: {
    borderColor: "#EF4444",
  },

  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
  },
});
