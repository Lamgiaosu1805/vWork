const VietnamesePhoneNumberRegex =
  /^(?:0)(?:3[2-9]|5[2,6,8,9]|7[0,6-9]|8[1-9]|9[0-4,6-9])\d{7}$/;
const EMAIL_REGEX =
  /^[A-Za-z0-9_.+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const Reg_Pass =
  /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/;
const hasWhiteSpace = (s) => {
  return /\s/g.test(s);
};

const validatePhoneNumber = (string) => {
  let errMsg = "";
  if (
    !string ||
    string === "null" ||
    String.prototype.trim.call(string) === ""
  ) {
    errMsg = "Vui lòng nhập số điện thoại";
  } else if (!VietnamesePhoneNumberRegex.test(string)) {
    errMsg = "Số điện thoại không đúng định dạng";
  }
  return errMsg;
};

const validateEmail = (email) => {
  let errMsg = "";

  if (!email || email === "null" || String.prototype.trim.call(email) === "") {
    errMsg = "Vui lòng nhập email";
  } else if (hasWhiteSpace(email)) {
    errMsg = "Email không được chứa khoảng trắng";
  } else if (!EMAIL_REGEX.test(email)) {
    errMsg = "Email không đúng định dạng";
  }

  return errMsg;
};

const validateIdentityId = (string) => {
  let errMsg = "";
  if (
    !string ||
    string === "null" ||
    String.prototype.trim.call(string) === ""
  ) {
    errMsg = "Vui lòng nhập CCCD/CMND";
  } else if (
    !(
      string.replaceAll(" ", "").length == 9 ||
      string.replaceAll(" ", "").length == 12
    )
  ) {
    errMsg = "Số CCCD/CMND không đúng định dạng";
  }
  return errMsg;
};

const validatePassword = (password) => {
  let errMsg = "";
  if (
    !password ||
    password === "null" ||
    String.prototype.trim.call(password) === ""
  ) {
    errMsg = "Vui lòng nhập mật khẩu";
  } else if (password.length < 8) {
    errMsg = "Mật khẩu phải từ 8 kí tự trở lên";
  } else if (hasWhiteSpace(password)) {
    errMsg = "Mật khẩu không chứa khoảng trắng";
  } else if (!Reg_Pass.test(password)) {
    errMsg =
      "Mật khẩu chứa ít nhất 1 chữ Hoa, 1 chữ thường, 1 ký tự đặc biệt và một ký tự số";
  }
  return errMsg;
};

const validateRePassword = (password, rePassword) => {
  let errMsg = "";
  if (
    !rePassword ||
    rePassword === "null" ||
    String.prototype.trim.call(rePassword) === ""
  ) {
    errMsg = "Vui lòng nhập lại mật khẩu";
  } else if (password !== rePassword) {
    errMsg = "Mật khẩu nhập lại phải trùng với mật khẩu đã nhập";
  }
  return errMsg;
};

export default {
  validatePhoneNumber,
  validateEmail,
  validateIdentityId,
  validatePassword,
  validateRePassword,
  hasWhiteSpace: (string) => /\s/.test(string),
};
