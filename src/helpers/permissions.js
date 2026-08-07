/**
 * user.role: "admin" | "manager" | "user"
 * user.module_access: string[]  e.g. ["hrm", "workplace", "crm"]
 * user.dept_scope: "all" | "own"
 * user.permissions: string[]  e.g. ["hrm.request.review"] — dotted "module.resource.action" codes
 */

/** Có thể xem module — admin luôn được, còn lại cần có trong module_access */
export const has = (user, mod) =>
  user?.role === "admin" || (user?.module_access ?? []).includes(mod);

/** Có quyền quản lý module — admin hoặc manager có module đó */
export const canMgr = (user, mod) =>
  user?.role === "admin" ||
  (user?.role === "manager" && (user?.module_access ?? []).includes(mod));

export const can = (user, code) =>
  user?.role === "admin" || (user?.permissions ?? []).includes(code);

export const canAny = (user, codes) =>
  user?.role === "admin" ||
  codes.some((code) => (user?.permissions ?? []).includes(code));

export const getPermissions = (user) => {
  const role = user?.role ?? "user";

  console.log("getPermissions - user:", user);

  return {
    role,
    isAdminRole: role === "admin",

    // Drawer — module visibility
    showHRM: true,
    showWorkplace: true,
    showCRM: has(user, "crm"),

    // HRM
    showEmployeeList: true,
    showAddEmployee: canMgr(user, "hrm"),
    showDepartmentList: has(user, "hrm"),
    showHrmMgmt: canMgr(user, "hrm"),
    canReviewRequests: canAny(user, [
      "hrm.request.review",
      "hrm.request.review_all",
    ]),
    canViewAllRequests: can(user, "hrm.request.view_all"),

    // Workplace
    showWeeklyReportAll: canMgr(user, "workplace"),
    showWeeklyReportMine: true,
    showFilesMgmt: canMgr(user, "workplace"),

    // CRM
    showMyCustomers: has(user, "crm"),
    showCustomerAll: canMgr(user, "crm"),
    showCrmDashboardManagement: canMgr(user, "crm"),
  };
};
