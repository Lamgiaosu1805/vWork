import { useEffect, useState } from "react";

/** Đồng hồ tick mỗi giây, lệch theo server_time (offsetMs). Dừng khi `active = false`. */
const useServerNow = (offsetMs = 0, active = true) => {
  const [now, setNow] = useState(() => Date.now() + offsetMs);

  useEffect(() => {
    setNow(Date.now() + offsetMs);
    if (!active) return undefined;
    const timer = setInterval(() => setNow(Date.now() + offsetMs), 1000);
    return () => clearInterval(timer);
  }, [offsetMs, active]);

  return now;
};

export default useServerNow;
