// Cầu nối từ axios interceptor (ngoài React) tới ForceUpdateGate: server trả 426 thì báo để hiện màn chặn
let listener = null;
let pending = null;

export const signalUpdateRequired = (release) => {
  pending = release ?? {};
  listener?.(pending);
};

export const subscribeUpdateRequired = (callback) => {
  listener = callback;
  if (pending) callback(pending);
  return () => {
    if (listener === callback) listener = null;
  };
};
