import dayjs from 'dayjs';

// Kỳ lương chạy từ 26 tháng trước -> 25 tháng hiện tại (đồng bộ logic với web)
export const getPeriodDates = (offset = 0) => {
    const today = dayjs();
    let baseStart, baseEnd;

    if (today.date() >= 26) {
        baseStart = today.date(26).startOf('day');
        baseEnd = today.add(1, 'month').date(25).endOf('day');
    } else {
        baseStart = today.subtract(1, 'month').date(26).startOf('day');
        baseEnd = today.date(25).endOf('day');
    }

    return {
        start: baseStart.add(offset, 'month'),
        end: baseEnd.add(offset, 'month'),
    };
};
