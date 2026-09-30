import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import RNBlobUtil from "react-native-blob-util";
import utils from "../../../helpers/utils";

const useUploadAvatar = () => {
  const accessToken = useSelector((s) => s.auth.accessToken);

  return useMutation({
    mutationFn: async (manipulatedUri) => {
      const response = await RNBlobUtil.fetch(
        "POST",
        `${utils.BASE_URL}/user/uploadAvatar`,
        { Authorization: `Bearer ${accessToken}`, "Content-Type": "multipart/form-data" },
        [
          {
            name: "avatar",
            filename: "avatar.jpg",
            type: "image/jpeg",
            data: RNBlobUtil.wrap(manipulatedUri.replace("file://", "")),
          },
        ],
      );
      return JSON.parse(response.data);
    },
  });
};

export default useUploadAvatar;
