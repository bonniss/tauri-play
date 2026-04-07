import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager,
} from "@mantine/core";
import type { ReactNode } from "react";
import { createProvider } from "react-easy-provider";

import "./index.css";

const theme = createTheme({
  primaryColor: "orange",
  defaultRadius: "md",
});

function useAppProviderValue(defaultColorScheme = "auto") {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: "tauri-app-color-scheme",
  });

  return {
    colorSchemeManager,
    defaultColorScheme,
    theme,
  };
}

const [useAppContext, InternalAppProvider] = createProvider(
  useAppProviderValue,
  "AppProvider",
);

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <InternalAppProvider>
      <AppProviderTheme>{children}</AppProviderTheme>
    </InternalAppProvider>
  );
}

function AppProviderTheme({ children }: AppProviderProps) {
  const { colorSchemeManager } = useAppContext();

  return (
    <MantineProvider
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
      theme={theme}
    >
      {children}
    </MantineProvider>
  );
}

export { useAppContext };
