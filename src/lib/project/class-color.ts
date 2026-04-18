import { MantineThemeColors } from '@mantine/core';

export const COLOR_CODE_PALETTE = [
  '#3b82f6',
  '#f97316',
  '#14b8a6',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#f43f5e',
  '#84cc16',
  '#a855f7',
];

const MANTINE_PALETTE: (keyof MantineThemeColors)[] = [
  // 'dark',
  // 'gray',
  'teal',
  'cyan',
  'indigo',
  'blue',
  'violet',
  'pink',
  'lime',
  'yellow',
  'green',
  'red',
  'orange',
  'grape',
];

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

export function colorFromString(seed: string | number): string {
  const seedStr = typeof seed === 'number' ? seed.toString() : seed;
  return MANTINE_PALETTE[djb2(seedStr) % MANTINE_PALETTE.length]!;
}
