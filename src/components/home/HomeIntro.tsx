import { FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"

type IntroParagraph = {
  className: string
  key: string
}

const INTRO_PARAGRAPHS: IntroParagraph[] = [
  {
    key: "home.intro.headline",
    className:
      "font-serif text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100",
  },
  {
    key: "home.intro.tagline",
    className: "text-lg leading-7 text-zinc-500 dark:text-zinc-400",
  },
]

const HomeIntro: FunctionComponent = () => {
  const { t } = useAppProvider()

  return (
    <section className="mx-auto w-full max-w-6xl px-6 md:px-10">
      <div className="space-y-3">
        {INTRO_PARAGRAPHS.map((p) => (
          <p key={p.key} className={p.className}>
            {t(p.key)}
          </p>
        ))}
      </div>
    </section>
  )
}

export default HomeIntro
