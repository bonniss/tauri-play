import { Button } from "@mantine/core"
import { IconArrowRight } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"

const HomeCtaFooter: FunctionComponent = () => {
  const { t } = useAppProvider()

  return (
    <section className="mx-auto w-full max-w-6xl px-6 md:px-10">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="max-w-xs text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t("home.cta.title")}
        </h2>
        <Button
          component={Link}
          rightSection={<IconArrowRight className="size-4" />}
          search={{ create: true } as never}
          size="md"
          to="/projects"
        >
          {t("home.hero.cta")}
        </Button>
      </div>
    </section>
  )
}

export default HomeCtaFooter
