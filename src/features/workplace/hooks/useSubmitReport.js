import { useMutation, useQueryClient } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useSubmitReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deptId, formData }) => workplaceApi.submitReport(deptId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDeptReport"] });
      queryClient.invalidateQueries({ queryKey: ["reportHistory"] });
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
    },
  });
};

export default useSubmitReport;
