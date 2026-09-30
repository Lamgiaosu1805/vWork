import React, { createContext, useContext, useState } from "react";

const AppSwitcherContext = createContext(null);

export const AppSwitcherProvider = ({ children }) => {
  const [selectedApp, setSelectedApp] = useState("TIKLUY");
  const appCode = selectedApp.toLowerCase();

  return (
    <AppSwitcherContext.Provider value={{ selectedApp, setSelectedApp, appCode }}>
      {children}
    </AppSwitcherContext.Provider>
  );
};

export const useAppSwitcher = () => {
  const ctx = useContext(AppSwitcherContext);
  if (!ctx) throw new Error("useAppSwitcher must be used within AppSwitcherProvider");
  return ctx;
};
