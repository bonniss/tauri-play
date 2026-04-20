import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { useHotkey } from '@tanstack/react-hotkeys';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { FunctionComponent, PropsWithChildren } from 'react';
import { appTheme } from './theme';

import { useDisclosure } from '@mantine/hooks';
import { createProvider } from 'react-easy-provider';
import { Toaster } from 'sonner';
import {
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  setAppSetting,
  type AppSettingKey,
  type AppSettingValues,
} from '~/lib/db/domain/app-settings';
import { useTranslate } from '~/lib/i18n';

const COLOR_SCHEME_STORAGE_KEY = '$colorScheme';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

interface AppProviderProps extends PropsWithChildren {}
export const AppProvider: FunctionComponent<AppProviderProps> = ({
  children,
}) => {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: COLOR_SCHEME_STORAGE_KEY,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        colorSchemeManager={colorSchemeManager}
        defaultColorScheme="auto"
        theme={appTheme}
      >
        <InternalProvider>{children}</InternalProvider>
      </MantineProvider>
      <Toaster richColors />
    </QueryClientProvider>
  );
};

const [useAppProvider, InternalProvider] = createProvider(() => {
  const translateHandlers = useTranslate();
  const qc = useQueryClient();

  const [
    appSettingsOpened,
    { toggle: toggleAppSettings, close: closeAppSettings },
  ] = useDisclosure();
  useHotkey('Shift+S', toggleAppSettings);

  const { data: appSettings = DEFAULT_APP_SETTINGS } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
    staleTime: Infinity,
  });

  type AppSettingUpdate = {
    [K in AppSettingKey]: { key: K; value: AppSettingValues[K] };
  }[AppSettingKey];

  const updateAppSettingMutation = useMutation<void, Error, AppSettingUpdate>({
    mutationFn: ({ key, value }) =>
      setAppSetting(key, value as AppSettingValues[typeof key]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-settings'] }),
  });

  return {
    ...translateHandlers,
    appSettings,
    updateAppSetting: updateAppSettingMutation.mutateAsync,
    appSettingsOpened,
    toggleAppSettings,
    closeAppSettings,
  };
});

export { useAppProvider };
