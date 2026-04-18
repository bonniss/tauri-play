/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSyncExternalStore } from 'react';
import { get as getProperty } from 'react-headless-form';
import { default as en } from './locales/en/app.json';
import { default as vi } from './locales/vi/app.json';
export { en, vi };

const RX_PARAM = /\{\{(\w+)\}\}/g;
const localeListeners = new Set<() => void>();

export interface I18nConfig {
  resources: Record<string, any>;
  fallbackLocale?: string;
  getLocale: () => string;
  setLocale?: (locale: string) => void;
  onLocaleChange?: (locale: string) => void;
}

let config: I18nConfig = {
  resources: {
    en,
    vi,
  },
  getLocale: () => 'en',
};

export function setupI18n(_config: Partial<I18nConfig>) {
  config = {
    ...config,
    ..._config,
    resources: {
      ...config.resources,
      ..._config.resources,
    },
  } as I18nConfig;
}

export function getLocale() {
  return config.getLocale();
}

export function setLocale(locale: string) {
  config.setLocale?.(locale);
  config.onLocaleChange?.(locale);
  localeListeners.forEach((listener) => listener());
}

function subscribeLocale(listener: () => void) {
  localeListeners.add(listener);

  return () => {
    localeListeners.delete(listener);
  };
}

export function useLocale() {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

export interface TranslateOptions {
  params?: Record<string, string | number>;
  fallback?: string;
  raw?: boolean;
}

/**
 * Translate a key from the i18n resources to its corresponding value.
 * If the key is not found, the fallback value is returned if provided.
 * Otherwise, the key itself is returned.
 * @param {string} key the key to translate
 * @param {TranslateOptions} [opts] object with options to customize the translation
 * @property {Record<string, string | number>} [opts.params] object with key-value pairs to replace placeholders in the translated value
 * @property {string} [opts.fallback] the value to return if the key is not found
 * @property {boolean} [opts.raw] if true, returns the original object/array from the i18n resources instead of translating it
 * @returns {string | any} the translated value, or the original object/array if opts.raw is true
 */
export function t(key: string, opts: TranslateOptions = {}): any {
  const { params, fallback, raw } = opts;

  const store =
    config.resources[config.getLocale()] ??
    (config.fallbackLocale && config.resources[config.fallbackLocale]);

  if (!store) return fallback ?? key;

  const message = getProperty(store, key);
  if (message === undefined || message === null) return fallback ?? key;

  // Nếu cần lấy nguyên object/array → trả thẳng ra
  if (raw || typeof message !== 'string') return message;

  // Replace placeholders
  return message.replace(RX_PARAM, (_, name) =>
    params && Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name])
      : '',
  );
}

export function useTranslate() {
  const locale = useLocale(); // re-render when locale changes
  return { t, locale, getLocale, setLocale };
}
