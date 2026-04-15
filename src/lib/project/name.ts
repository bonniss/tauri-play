const ADJECTIVES = [
  "amber",
  "bold",
  "brisk",
  "calm",
  "clever",
  "crisp",
  "curious",
  "daring",
  "eager",
  "fast",
  "gentle",
  "glossy",
  "happy",
  "icy",
  "jolly",
  "kind",
  "lively",
  "mellow",
  "nimble",
  "quiet",
  "rapid",
  "shiny",
  "sparkling",
  "steady",
  "sunny",
  "swift",
  "tidy",
  "vivid",
  "warm",
  "zesty",
] as const

export const ANIMAL_ICON_OPTIONS = [
  { icon: "🐶", label: "dog", value: "dog" },
  { icon: "🐱", label: "cat", value: "cat" },
  { icon: "🐭", label: "mouse", value: "mouse" },
  { icon: "🐹", label: "hamster", value: "hamster" },
  { icon: "🐰", label: "rabbit", value: "rabbit" },
  { icon: "🦊", label: "fox", value: "fox" },
  { icon: "🐻", label: "bear", value: "bear" },
  { icon: "🐼", label: "panda", value: "panda" },
  { icon: "🐨", label: "koala", value: "koala" },
  { icon: "🐯", label: "tiger", value: "tiger" },
  { icon: "🦁", label: "lion", value: "lion" },
  { icon: "🐮", label: "cow", value: "cow" },
  { icon: "🐷", label: "pig", value: "pig" },
  { icon: "🐸", label: "frog", value: "frog" },
  { icon: "🐵", label: "monkey", value: "monkey" },
  { icon: "🐔", label: "chicken", value: "chicken" },
  { icon: "🦆", label: "duck", value: "duck" },
  { icon: "🦉", label: "owl", value: "owl" },
  { icon: "🦅", label: "eagle", value: "eagle" },
  { icon: "🐴", label: "horse", value: "horse" },
  { icon: "🦓", label: "zebra", value: "zebra" },
  { icon: "🐢", label: "turtle", value: "turtle" },
  { icon: "🐬", label: "dolphin", value: "dolphin" },
  { icon: "🐳", label: "whale", value: "whale" },
  { icon: "🦄", label: "unicorn", value: "unicorn" },
  { icon: "🐲", label: "dragon", value: "dragon" },
  { icon: "🐙", label: "octopus", value: "octopus" },
  { icon: "🦒", label: "giraffe", value: "giraffe" },
  { icon: "🐘", label: "elephant", value: "elephant" },
  { icon: "🦏", label: "rhino", value: "rhino" },
  { icon: "🦛", label: "hippo", value: "hippo" },
  { icon: "🦘", label: "kangaroo", value: "kangaroo" },
  { icon: "🦇", label: "bat", value: "bat" },
  { icon: "🦔", label: "hedgehog", value: "hedgehog" },
  { icon: "🐍", label: "snake", value: "snake" },
] as const

const ANIMAL_ENTRIES = ANIMAL_ICON_OPTIONS.map((item) => ({
  icon: item.icon,
  noun: item.label,
}))

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export function generateRandomProjectName() {
  return `${pickRandom(ADJECTIVES)} ${pickRandom(ANIMAL_ENTRIES).noun}`
}

export function findProjectIconForName(name: string) {
  const normalizedName = name.trim().toLowerCase()
  const parts = normalizedName.split(/\s+/)
  const noun = parts.length > 0 ? parts[parts.length - 1] : null

  if (!noun) {
    return ANIMAL_ICON_OPTIONS[0].icon
  }

  return (
    ANIMAL_ICON_OPTIONS.find((item) => item.value === noun)?.icon ??
    ANIMAL_ICON_OPTIONS[0].icon
  )
}

export function generateRandomProjectIdentity() {
  const adjective = pickRandom(ADJECTIVES)
  const animal = pickRandom(ANIMAL_ENTRIES)

  return {
    icon: animal.icon,
    name: `${adjective} ${animal.noun}`,
  }
}
