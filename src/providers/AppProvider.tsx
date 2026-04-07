import {
  MantineProvider,
  localStorageColorSchemeManager,
} from "@mantine/core";
import type { ReactNode } from "react";
import { createProvider } from "react-easy-provider";
import { COLOR_SCHEME_STORAGE_KEY } from "../constants/storage";
import { AppRouter } from "../router";
import { appTheme } from "../theme";

import "../index.css";

function useAppProviderValue(defaultColorScheme = "auto") {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: COLOR_SCHEME_STORAGE_KEY,
  });

  return {
    colorSchemeManager,
    defaultColorScheme,
    theme: appTheme,
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
      theme={appTheme}
    >
      {children}
    </MantineProvider>
  );
}

export { useAppContext };
