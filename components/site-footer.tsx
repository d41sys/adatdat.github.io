import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"

export function SiteFooter() {
  return (
    <footer className="border-t border-black py-6 md:py-0 selection:bg-redCustom selection:text-black">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Icons.logo className="hidden h-4 w-4 md:inline-block" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              ./d41sy
            </a>
            {" "}--main=security --other=react-dev@freelance
          </p>
        </div>
      </div>
    </footer>
  )
}