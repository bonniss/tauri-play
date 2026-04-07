import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager,
} from "@mantine/core";
import type { ReactNode } from "react";
import { createProvider } from "react-easy-provider";
import { AppRouter } from "./router";

import "./index.css";

export const COLOR_SCHEME_STORAGE_KEY = "tauri-app-color-scheme";

const theme = createTheme({
  primaryColor: "orange",
  defaultRadius: "md",
});

function useAppProviderValue(defaultColorScheme = "auto") {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: COLOR_SCHEME_STORAGE_KEY,
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
  children?: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <InternalAppProvider>
      <AppProviderTheme>
        {children}
        <AppRouter />
      </AppProviderTheme>
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
