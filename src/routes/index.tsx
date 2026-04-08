import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden">
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-10 px-4 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2">
          <div className="absolute left-[12%] top-[18%] h-52 w-52 rounded-full bg-orange-400/20 blur-3xl dark:bg-orange-300/15" />
          <div className="absolute left-1/2 top-[6%] h-64 w-64 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-200/10" />
          <div className="absolute right-[10%] top-[24%] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-300/12" />
          <div className="absolute left-1/2 top-[52%] h-40 w-[24rem] -translate-x-1/2 rounded-full bg-white/25 blur-3xl dark:bg-white/5" />
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <Logo alt="Tauri" src="/tauri.svg" />
          <Logo alt="React" src="/react.svg" />
          <Logo alt="Vite" src="/vite.svg" />
        </div>

        <div className="space-y-3">
          <h1 className="bg-[linear-gradient(135deg,_#f97316_0%,_#fb7185_32%,_#f59e0b_58%,_#22c55e_78%,_#38bdf8_100%)] bg-clip-text text-5xl font-black tracking-[-0.06em] text-transparent dark:bg-[linear-gradient(135deg,_#fdba74_0%,_#f9a8d4_34%,_#fde68a_60%,_#86efac_80%,_#7dd3fc_100%)] sm:text-7xl">
            Tauri Starter
          </h1>
          <p className="text-lg">
            Opinionated Tauri app template with React, Tailwind and Mantine.
          </p>
        </div>
      </div>
    </section>
  )
}

function Logo({ alt, src }: { alt: string; src: string }) {
  return <img alt={alt} className="size-14 sm:size-20" src={src} />
}

export default HomePage
