import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import attendanceApi from "../api/attendanceApi";

const EMPTY_SUMMARY = { totalMinutes: 0, forgotCount: 0, unpaidLeaveCount: 0 };

const useLichCong = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["lichCong"],
    queryFn: async () => {
      const res = await attendanceApi.getLichCong();
      const records = res.data?.data || [];

      const summary = records.reduce((acc, cur) => {
        acc.totalMinutes += (cur.minutes_late || 0) + (cur.minute_early || 0);
        if (!cur.check_in && !cur.check_out) {
          acc.unpaidLeaveCount += 1;
        } else if (!cur.check_in || !cur.check_out) {
          acc.forgotCount += 1;
        }
        return acc;
      }, EMPTY_SUMMARY);

      const calendarData = records.reduce((acc, item) => {
        acc[dayjs(item.date).format("YYYY-MM-DD")] = item;
        return acc;
      }, {});

      return { summary, calendarData };
    },
  });

  return {
    summary: data?.summary ?? EMPTY_SUMMARY,
    calendarData: data?.calendarData ?? {},
    isLoading,
    refetch,
  };
};

export default useLichCong;
