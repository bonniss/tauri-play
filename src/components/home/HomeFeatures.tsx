import { Paper } from "@mantine/core"
import {
  IconAdjustments,
  IconBolt,
  IconCamera,
  IconInfinity,
  IconPlayerPlay,
  IconShare,
} from "@tabler/icons-react"
import { FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"
import HomePlatform from "./HomePlatform"

type FeatureCard = {
  bgClass: string
  descriptionKey: string
  icon: React.ElementType
  iconClass: string
  titleKey: string
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: IconBolt,
    titleKey: "home.features.fast.title",
    descriptionKey: "home.features.fast.description",
    iconClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    icon: IconInfinity,
    titleKey: "home.features.unlimited.title",
    descriptionKey: "home.features.unlimited.description",
    iconClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/40",
  },
  {
    icon: IconAdjustments,
    titleKey: "home.features.defaults.title",
    descriptionKey: "home.features.defaults.description",
    iconClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    icon: IconCamera,
    titleKey: "home.features.flexibleInput.title",
    descriptionKey: "home.features.flexibleInput.description",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: IconPlayerPlay,
    titleKey: "home.features.easyPlay.title",
    descriptionKey: "home.features.easyPlay.description",
    iconClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-50 dark:bg-rose-950/40",
  },
  {
    icon: IconShare,
    titleKey: "home.features.easyShare.title",
    descriptionKey: "home.features.easyShare.description",
    iconClass: "text-fuchsia-600 dark:text-fuchsia-400",
    bgClass: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
  },
]

const HomeFeatures: FunctionComponent = () => {
  const { t } = useAppProvider()

  return (
    <section className="mx-auto w-full max-w-6xl px-6 md:px-10">
      <h3 className="mb-4 text-center text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {t("home.features.coreTitle")}
      </h3>
      <HomePlatform />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURE_CARDS.map((card) => {
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
                <Icon className={`size-7 ${card.iconClass}`} />
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

export default HomeFeatures
