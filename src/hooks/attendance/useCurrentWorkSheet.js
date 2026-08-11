import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import attendanceApi from "../../api/attendanceApi";

const useCurrentWorkSheet = () => {
  const dispatch = useDispatch();
  const currentWorkSheet = useSelector(
    (state) => state.attendance.currentWorkSheet,
  );
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      await attendanceApi.getCurrentWorkSheet(dispatch);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { currentWorkSheet, isLoading, refetch };
};

export default useCurrentWorkSheet;
