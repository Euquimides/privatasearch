import { SearchProvider } from '@/context/SearchContext'
// @ts-ignore
import './globals.css'


export const metadata = {
  title: 'PrivataSearch',
  description: 'Buscador de jurisprudencia de protección de datos personales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        {/* Precargar índice de resoluciones */}
        <link
          rel="preload"
          href="/privatasearch/indice-resoluciones-prodhab.json"
          as="fetch"
          type="application/json"
          crossOrigin="anonymous"
        />
        <link
          rel="prefetch"
          href="/privatasearch/indice-resoluciones-prodhab.json"
        />
      </head>
      <body>
        <SearchProvider>
          {children}
        </SearchProvider>
      </body>
    </html>
  );
}