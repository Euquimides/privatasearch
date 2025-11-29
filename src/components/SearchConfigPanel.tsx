import React from 'react';
import { Settings, Filter, TrendingUp } from 'lucide-react';

interface SearchConfigPanelProps {
  limit: number;
  setLimit: (value: number) => void;
  similarityThreshold: number;
  setSimilarityThreshold: (value: number) => void;
  relatedLimit: number;
  setRelatedLimit: (value: number) => void;
  onApply: () => void;
}

export function SearchConfigPanel({
  limit, setLimit,
  similarityThreshold, setSimilarityThreshold,
  relatedLimit, setRelatedLimit,
  onApply
}: SearchConfigPanelProps) {
  const [applying, setApplying] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleApply = () => {
    setApplying(true);
    Promise.resolve(onApply()).finally(() => {
      setApplying(false);
      setIsExpanded(false);
    });
  };

  const handleReset = () => {
    setLimit(10);
    setSimilarityThreshold(0.5);
    setRelatedLimit(5);
  };

  const hasActiveFilters = limit !== 10 || similarityThreshold !== 0.5 || relatedLimit !== 5;

  return (
    <div className="mb-6">
      {/* Compact header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Configuración de búsqueda
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {hasActiveFilters ? 'Filtros personalizados activos' : 'Click para personalizar resultados'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              !
            </span>
          )}
          <svg
            className={`h-5 w-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Results Settings */}
            <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-700">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Límites de resultados
                </h3>
              </div>

              <div>
                <label htmlFor="result-limit" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Resultados principales
                </label>
                <div className="relative">
                  <select
                    id="result-limit"
                    value={limit}
                    onChange={e => setLimit(Number(e.target.value))}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value={5}>5 resultados</option>
                    <option value={10}>10 resultados</option>
                    <option value={20}>20 resultados</option>
                    <option value={50}>50 resultados</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="related-limit" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Resoluciones relacionadas
                </label>
                <div className="relative">
                  <select
                    id="related-limit"
                    value={relatedLimit}
                    onChange={e => setRelatedLimit(Number(e.target.value))}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value={3}>3 relacionadas</option>
                    <option value={5}>5 relacionadas</option>
                    <option value={10}>10 relacionadas</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Similarity Settings */}
            <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-700">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Precisión de similitud
                </h3>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label htmlFor="similarity-threshold" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Umbral mínimo
                  </label>
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-green-500 px-3 py-1 text-sm font-bold text-white">
                    {(similarityThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  id="similarity-threshold"
                  type="range"
                  min={0}
                  max={100}
                  value={similarityThreshold * 100}
                  onChange={e => setSimilarityThreshold(Number(e.target.value) / 100)}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600"
                  style={{
                    background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(34 197 94) ${similarityThreshold * 100}%, rgb(229 231 235) ${similarityThreshold * 100}%, rgb(229 231 235) 100%)`
                  }}
                />
                <div className="mt-2 flex justify-between text-xs text-neutral-500">
                  <span>Más resultados</span>
                  <span>Más precisos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <button
              onClick={handleReset}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750"
            >
              Restablecer
            </button>
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-neutral-900"
            >
              {applying ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Aplicando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aplicar configuración
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
