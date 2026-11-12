import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONSENT_VERSION } from "../constants";
import { accountKeyOf, consentStorageKey } from "../lib/accountKey";

// App Store (5.1.2(i)): phải xin đồng ý trước khi gửi dữ liệu cá nhân cho AI bên thứ ba.
// status: "loading" | "needed" | "granted"
const useHandbookConsent = () => {
  const accountKey = useSelector((state) => accountKeyOf(state.auth.user));
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!accountKey) return undefined;
    let alive = true;
    AsyncStorage.getItem(consentStorageKey(accountKey))
      .then((value) => {
        if (alive) setStatus(Number(value) === CONSENT_VERSION ? "granted" : "needed");
      })
      .catch(() => alive && setStatus("needed"));
    return () => {
      alive = false;
    };
  }, [accountKey]);

  const accept = useCallback(async () => {
    setStatus("granted");
    if (accountKey) {
      await AsyncStorage.setItem(consentStorageKey(accountKey), String(CONSENT_VERSION)).catch(() => {});
    }
  }, [accountKey]);

  return { status, accept };
};

export default useHandbookConsent;
