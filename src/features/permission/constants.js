export const CRM_INVESTMENT_PERMISSIONS = ["investment.view", "investment.leaderboard"];
export const CRM_AGENT_PERMISSIONS = ["agent.view"];

// Module-level access — khớp CRM_ACCESS_PERMISSIONS/HRM_ACCESS_PERMISSIONS bên website-crm
// (features/permission/constants.js), dùng để ẩn/hiện tab CRM/HRM trong drawer.
export const CRM_ACCESS_PERMISSIONS = [
  "customer.view",
  "customer.claim",
  "customer.ai_insight",
  "investment.view",
  "investment.leaderboard",
  "commission.view",
  "transaction.view",
  "ai_chat.use",
  "claim_period.view",
  "customer_claim_request.create",
];

export const HRM_ACCESS_PERMISSIONS = ["employee.view"];
