import { MantineProvider, localStorageColorSchemeManager } from "@mantine/core"
import { useHotkey } from "@tanstack/react-hotkeys"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { FunctionComponent, PropsWithChildren } from "react"
import { appTheme } from "./theme"

import { useDisclosure } from "@mantine/hooks"
import { createProvider } from "react-easy-provider"
import "~/assets/styles/index.css"

const COLOR_SCHEME_STORAGE_KEY = "$colorScheme"
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
})

interface AppProviderProps extends PropsWithChildren {}
export const AppProvider: FunctionComponent<AppProviderProps> = ({
  children,
}) => {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: COLOR_SCHEME_STORAGE_KEY,
  })

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        colorSchemeManager={colorSchemeManager}
        defaultColorScheme="auto"
        theme={appTheme}
      >
        <InternalProvider>{children}</InternalProvider>
      </MantineProvider>
    </QueryClientProvider>
  )
}

const [useAppProvider, InternalProvider] = createProvider(() => {
  const [
    appSettingsOpened,
    { toggle: toggleAppSettings, close: closeAppSettings },
  ] = useDisclosure()
  useHotkey("Shift+S", toggleAppSettings)

  return {
    appSettingsOpened,
    toggleAppSettings,
    closeAppSettings,
  }
})

export { useAppProvider }
