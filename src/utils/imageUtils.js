import utils from "../helpers/utils";

export const buildImageUri = (key_image) =>
  `${utils.BASE_URL}/customer/view-image?key_image=${encodeURIComponent(key_image)}`;
