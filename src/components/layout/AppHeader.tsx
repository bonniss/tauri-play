import { Button } from "@mantine/core"
import { useHeadroom, useWindowScroll } from "@mantine/hooks"
import { Link } from "@tanstack/react-router"
import clsx from "clsx"
import { FunctionComponent } from "react"
import { t } from "~/lib/i18n"
import AppSettings from "./AppSettings"

interface AppHeaderProps {}

const AppHeader: FunctionComponent<AppHeaderProps> = () => {
  const { pinned, scrollProgress } = useHeadroom({ fixedAt: 80 })
  console.log("🚀 ~ AppHeader ~ scrollProgress:", scrollProgress)
  const [scroll] = useWindowScroll()

  const isTop = scroll.y < 80

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 h-[60px] transition-all duration-300",
        isTop
          ? "bg-transparent border-transparent"
          : "backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border-b border-zinc-200/50 dark:border-zinc-800/50",
      )}
      style={{
        transform: `translateY(${(scrollProgress - 1) * 100}%)`,
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-4">
        <div className="flex items-center gap-2">
          <Button component={Link} size="compact-sm" to="/" variant="subtle">
            {t("header.home")}
          </Button>
          <Button
            component={Link}
            size="compact-sm"
            to="/projects"
            variant="subtle"
          >
            {t("header.projects")}
          </Button>
          <AppSettings />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
