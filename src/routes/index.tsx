import { createFileRoute } from "@tanstack/react-router"
import HomeHero from "~/components/home/HomeHero"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-10">
      <HomeHero />
    </section>
  )
}

export default HomePage
