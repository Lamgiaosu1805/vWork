import { useSelector } from "react-redux";
import useMyPermissions from "../../permission/hooks/useMyPermissions";
import { getPermissions } from "../../../helpers/permissions";

/** Xem báo cáo tuần các phòng: quản lý workplace (hệ cũ) hoặc weekly_report.view (hệ quyền mới). */
const useCanViewAllWeeklyReports = () => {
  const user = useSelector((state) => state.auth.user);
  const { permissions } = useMyPermissions();

  return getPermissions(user).showWeeklyReportAll || permissions.includes("weekly_report.view");
};

export default useCanViewAllWeeklyReports;
