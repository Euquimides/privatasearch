export default function Footer() {
  // For custom domain, logo should be at root

  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Proyecto de Código Abierto creado por:
          </p>
          <div className="flex items-center gap-2">
            <a href="https://www.vasquezdrexler.abogado/">
              <img src="/logo.png" alt="Logo" style={{ height: '100px' }} />
            </a>
          </div>
            <div className="mt-4 flex items-center justify-center gap-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              © {new Date().getFullYear()} · Licencia MIT
            </p>
            <a
              href="/disclaimer"
              className="text-xs text-neutral-500 hover:underline dark:text-neutral-400"
            >
              Descargo de responsabilidad
            </a>
            </div>
        </div>
      </div>
    </footer>
  );
}