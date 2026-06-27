import React, { createContext } from "react";
import { useColorScheme } from "react-native";

import lightTheme from "./lightTheme";
import darkTheme from "./darkTheme";

export const ThemeContext = createContext(lightTheme);

export const ThemeProvider = ({ children }) => {
  const scheme = useColorScheme();
  console.log(scheme);

  const theme = scheme === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};
