import { router } from "expo-router";

export const CUSTOMER_CARE_QUEUE_ROUTE = "/crm/customer-care";
export const CUSTOMER_CARE_PUSH_TYPES = [
  "customer_care_assigned",
  "customer_care_sla_warning",
  "customer_care_revoked",
];

export const isCustomerCarePushType = (type) => CUSTOMER_CARE_PUSH_TYPES.includes(type);

// Mở app từ trạng thái tắt hẳn: Splash/Login chưa router.replace() vào module → giữ lại, điều hướng sau
let navigationReady = false;
let pendingNavigation = false;

const goToCareQueue = () => {
  router.navigate(CUSTOMER_CARE_QUEUE_ROUTE);
};

export const navigateToCareQueue = () => {
  if (!navigationReady) {
    pendingNavigation = true;
    return;
  }
  goToCareQueue();
};

/** Gọi sau khi Splash/Login đã router.replace() vào module; `canOpenCrm` = có quyền vào CRM. */
export const markCareNavigationReady = (canOpenCrm) => {
  navigationReady = true;
  if (!pendingNavigation) return;
  pendingNavigation = false;
  if (canOpenCrm) setTimeout(goToCareQueue, 50);
};
