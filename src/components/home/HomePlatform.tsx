import { Paper } from "@mantine/core"
import {
  IconDevices,
  IconPackage,
  IconUserOff,
  IconWifiOff,
} from "@tabler/icons-react"
import { FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"

type PlatformCard = {
  bgClass: string
  descriptionKey: string
  icon: React.ElementType
  iconClass: string
  titleKey: string
}

const PLATFORM_CARDS: PlatformCard[] = [
  {
    icon: IconPackage,
    titleKey: "home.features.env.install.title",
    descriptionKey: "home.features.env.install.description",
    iconClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-50 dark:bg-teal-950/40",
  },
  {
    icon: IconDevices,
    titleKey: "home.features.env.crossPlatform.title",
    descriptionKey: "home.features.env.crossPlatform.description",
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: IconWifiOff,
    titleKey: "home.features.env.offline.title",
    descriptionKey: "home.features.env.offline.description",
    iconClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-50 dark:bg-green-950/40",
  },
  {
    icon: IconUserOff,
    titleKey: "home.features.env.noAccount.title",
    descriptionKey: "home.features.env.noAccount.description",
    iconClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-950/40",
  },
]

const HomePlatform: FunctionComponent = () => {
  const { t } = useAppProvider()

  return (
    <section className="mx-auto w-full max-w-6xl px-6 md:px-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Paper
              key={card.titleKey}
              withBorder
              className="flex flex-col gap-3 p-6"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${card.bgClass}`}
              >
                <Icon className={`size-5 ${card.iconClass}`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {t(card.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t(card.descriptionKey)}
                </p>
              </div>
            </Paper>
          )
        })}
      </div>
    </section>
  )
}

export default HomePlatform
