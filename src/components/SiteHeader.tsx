import Image from "next/image";
import Link from "next/link";
import { DarkModeToggle } from "./DarkModeToggle";
import { TourButton } from "./Tour";

export function SiteHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[oklch(0.85_0.01_250)] dark:border-[oklch(0.25_0.01_250)] bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-12">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Image
              src="/privatasearch_logo.png"
              alt="PrivataSearch"
              width={28}
              height={28}
              className="h-7 w-auto"
            />
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Privata<span className="text-blue-600 dark:text-blue-400">Search</span>
            </span>
          </Link>
          {subtitle && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center">
          <TourButton />
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
