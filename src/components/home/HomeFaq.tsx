import { Accordion, Paper } from "@mantine/core"
import { FunctionComponent } from "react"
import { en } from "~/lib/i18n"
import { useAppProvider } from "../layout/AppProvider"
import MarkdownViewer from "../shared/MarkdownViewer"

type FaqItem = {
  a: string
  q: string
}

const HomeFaq: FunctionComponent = () => {
  const { t } = useAppProvider()
  const rawFaq = t("faq", { raw: true })
  const faqItems = (Array.isArray(rawFaq) ? rawFaq : en.faq) as FaqItem[]

  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-3xl scroll-mt-24 px-6 md:px-10"
    >
      <h3 className="text-2xl font-semibold tracking-tight mb-6 text-center">
        {t("home.faqTitle")}
      </h3>

      <Paper>
        <Accordion chevronPosition="right" variant="contained" radius="lg">
          {faqItems.map((item, index) => (
            <Accordion.Item key={`${index}-${item.q}`} value={`faq-${index}`}>
              <Accordion.Control className="text-left text-lg font-serif font-semibold">
                {item.q}
              </Accordion.Control>
              <Accordion.Panel>
                <MarkdownViewer className="max-w-none text-base leading-7 text-zinc-600 dark:text-zinc-300">
                  {item.a}
                </MarkdownViewer>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Paper>
    </section>
  )
}

export default HomeFaq
