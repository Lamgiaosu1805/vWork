export const CARE_QUERY_ROOT = "crmCustomerCare";

export const CARE_QUERY_KEYS = {
  myQueue: [CARE_QUERY_ROOT, "myQueue"],
  history: (customerId) => [CARE_QUERY_ROOT, "history", customerId],
  interactions: (externalId) => [CARE_QUERY_ROOT, "interactions", externalId],
  dashboard: (params) => [CARE_QUERY_ROOT, "dashboard", params],
  sales: (appCode) => [CARE_QUERY_ROOT, "sales", appCode],
};

// Phân khách tự động giai đoạn 1 chỉ bật cho TIKLUY
export const CARE_SUPPORTED_APP_CODE = "tikluy";
