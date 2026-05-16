import api from "./axiosInstance";

const changePassword = async (currentPassword, newPassword) => {
  return api.post(
    "/auth/changePassword",
    {
      currentPassword,
      newPassword,
    },
    {
      requiresAuth: true,
    },
  );
};

export { changePassword };
