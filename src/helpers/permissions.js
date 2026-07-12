/**
 * user.role: "admin" | "manager" | "user"
 * user.module_access: string[]  e.g. ["hrm", "workplace", "crm"]
 * user.dept_scope: "all" | "own"
 */

/** Có thể xem module — admin luôn được, còn lại cần có trong module_access */
export const has = (user, mod) =>
  user?.role === "admin" || (user?.module_access ?? []).includes(mod);

/** Có quyền quản lý module — admin hoặc manager có module đó */
export const canMgr = (user, mod) =>
  user?.role === "admin" ||
  (user?.role === "manager" && (user?.module_access ?? []).includes(mod));

/**
 * Trả về tập named flags phân quyền — tương đương usePermissions() bên web.
 * Dùng trong component: const perms = getPermissions(user); if (perms.showCRM) ...
 *
 * Các flag này phải khớp 1-1 với usePermissions.js ở vWork-website.
 * Khi thêm flag mới: thêm vào cả hai file đồng thời.
 */
export const getPermissions = (user) => {
  const role = user?.role ?? "user";

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
