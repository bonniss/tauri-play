import { Paper } from "@mantine/core"
import {
  IconAdjustments,
  IconBolt,
  IconCamera,
  IconDevices,
  IconInfinity,
  IconPackage,
  IconPlayerPlay,
  IconShare,
  IconUserOff,
  IconWifiOff,
} from "@tabler/icons-react"
import { CSSProperties, FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"
import useRevealOnScroll from "./useRevealOnScroll"

type InfoCard = {
  bgClass: string
  descriptionKey: string
  icon: React.ElementType
  iconClass: string
  titleKey: string
}

const PLATFORM_CARDS: InfoCard[] = [
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

const FEATURE_CARDS: InfoCard[] = [
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

function HomeFeatureCard({
  card,
  index,
  isVisible,
}: {
  card: InfoCard
  index: number
  isVisible: boolean
}) {
  const { t } = useAppProvider()
  const Icon = card.icon

  return (
    <Paper
      withBorder
      className={[
        "flex flex-col gap-3 p-6 transition duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
      ].join(" ")}
      style={
        {
          transitionDelay: isVisible ? `${index * 90}ms` : "0ms",
        } satisfies CSSProperties
      }
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
}

const HomeFeatures: FunctionComponent = () => {
  const { t } = useAppProvider()
  const { isVisible, ref } = useRevealOnScroll()

  return (
    <section ref={ref} className="mx-auto w-full max-w-6xl px-6 md:px-10">
      <div className="space-y-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_CARDS.map((card, index) => (
            <HomeFeatureCard
              key={card.titleKey}
              card={card}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((card, index) => (
            <HomeFeatureCard
              key={card.titleKey}
              card={card}
              index={PLATFORM_CARDS.length + index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeFeatures
