import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import RNBlobUtil from "react-native-blob-util";
import utils from "../../../helpers/utils";

const useUploadCoverPhoto = () => {
  const accessToken = useSelector((s) => s.auth.accessToken);

  return useMutation({
    mutationFn: async (asset) => {
      const response = await RNBlobUtil.fetch(
        "POST",
        `${utils.BASE_URL}/user/uploadCoverPhoto`,
        { Authorization: `Bearer ${accessToken}`, "Content-Type": "multipart/form-data" },
        [
          {
            name: "cover_photo",
            filename: asset.fileName ?? "cover.jpg",
            type: asset.mimeType ?? "image/jpeg",
            data: RNBlobUtil.wrap(asset.uri.replace("file://", "")),
          },
        ],
      );
      return JSON.parse(response.data);
    },
  });
};

export default useUploadCoverPhoto;
