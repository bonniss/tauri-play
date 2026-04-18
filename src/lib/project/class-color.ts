const PALETTE = [
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
]

function djb2(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

export function getClassColor(seed: string): string {
  return PALETTE[djb2(seed) % PALETTE.length]!
}
