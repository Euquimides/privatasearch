import Footer from '@/components/Footer'
import { Suspense } from 'react'
import SearchClient from '@/components/SearchClient'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16 flex flex-col items-center">
          <img
            src="/privatasearch/privatasearch_logo.png"
            alt="Privatasearch Logo"
            className="mb-6"
            style={{ width: '120px', height: 'auto', minWidth: '96px' }}
          />
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl text-center leading-normal">
            PrivataSearch
          </h1>
          <h3 className="mb-3 text-2xl font-light tracking-tight text-neutral-900 dark:text-neutral-100 md:text-3xl text-center leading-normal" style={{ lineHeight: '1.5' }}>
            Buscador De Resoluciones Sobre Protección De Datos Personales En Costa Rica
          </h3>
        </div>
        {/* Client-side buscador UI */}
        <Suspense fallback={<div className="text-center py-12">Cargando buscador...</div>}>
          <SearchClient />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}