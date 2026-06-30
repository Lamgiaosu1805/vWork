import { useMemo } from "react";
import { useSelector } from "react-redux";
import utils from "../helpers/utils";

const useGetImageMessage = (item) => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  const uri = useMemo(() => {
    if (item.type === "group") {
      return `${utils.BASE_URL}/chat/conversations/${item._id}/avatar`;
    } else {
      if (!item || item?.type !== "image" || item?.recalled?.at) return null;

      if (
        item?.status === "sending" &&
        item?.attachment?.url?.startsWith("file:")
      ) {
        return item.attachment.url;
      }

      if (!item?._id || !item?.conversationId) return null;

      return `${utils.BASE_URL}/chat/conversations/${item.conversationId}/messages/${item._id}/image`;
    }
  }, [item]);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken],
  );

  return { uri, headers };
};

export default useGetImageMessage;
