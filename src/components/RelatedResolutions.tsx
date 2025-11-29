import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { getSimilarityLabel, getSimilarityColor } from '@/utils/semanticSimilarity';

interface RelatedResolution {
  id: string;
  expediente?: string;
  resolucion?: string;
  date?: string;
  similarity: number;
  texto?: string;
  archivo_origen?: string;
}

interface RelatedResolutionsProps {
  items: RelatedResolution[];
  minSimilarity?: number;
  maxItems?: number;
  showVisualization?: boolean;
}

export function RelatedResolutions({ 
  items, 
  minSimilarity = 0.5,
  maxItems = 5,
  showVisualization = true 
}: RelatedResolutionsProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedText, setExpandedText] = useState<{[id: string]: boolean}>({});

  // Expandir todos los textos relacionados
  const handleExpandAll = () => {
    const allIds = Object.fromEntries(filteredItems.map(item => [item.id, true]));
    setExpandedText(allIds);
  };
  // Colapsar todos los textos relacionados
  const handleCollapseAll = () => {
    const allIds = Object.fromEntries(filteredItems.map(item => [item.id, false]));
    setExpandedText(allIds);
  };
  
  if (!items || items.length === 0) return null;
  
  // Filtrar por similitud mínima
  const filteredItems = items.filter(item => item.similarity >= minSimilarity);
  
  if (filteredItems.length === 0) return null;
  
  // Mostrar solo maxItems inicialmente
  const displayItems = expanded ? filteredItems : filteredItems.slice(0, maxItems);
  const hasMore = filteredItems.length > maxItems;

  return (
    <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Resoluciones Relacionadas
            <span className="ml-2 text-xs font-normal text-neutral-500 dark:text-neutral-400">
              ({filteredItems.length})
            </span>
          </h3>
          {showVisualization && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>Similitud:</span>
              <div className="flex flex-wrap items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-[10px]">Alta</span>
                <div className="ml-2 h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px]">Media</span>
                <div className="ml-2 h-2 w-2 rounded-full bg-yellow-500"></div>
                <span className="text-[10px]">Baja</span>
              </div>
            </div>
          )}
        </div>
        {/* Botones para expandir/colapsar todos los textos relacionados */}
        {filteredItems.length > 0 && (
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button
              onClick={handleExpandAll}
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
              Ver todos
            </button>
            <button
              onClick={handleCollapseAll}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Colapsar todos
            </button>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {displayItems.map((item) => {
          const colors = getSimilarityColor(item.similarity);
          const label = getSimilarityLabel(item.similarity);
          const isTextExpanded = expandedText[item.id] || false;
          return (
            <li 
              key={item.id} 
              className={`rounded-lg border p-3 transition-all hover:shadow-sm ${colors.bg} ${colors.border}`}
            >
              <div className="flex flex-col gap-2">
                {/* Título y metadatos */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {item.expediente && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          Exp: {item.expediente}
                        </span>
                      )}
                      {item.resolucion && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          Res: {item.resolucion}
                        </span>
                      )}
                      {item.date && (
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 flex items-center gap-1.5">
                          {/* Icono de calendario para la fecha, igual que SearchResults */}
                          <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {item.date}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de descarga mínimo */}
                  {item.archivo_origen && (
                    <a
                      href={item.archivo_origen}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750 dark:hover:border-neutral-600"
                      title="Descargar Resolución"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Descargar</span>
                    </a>
                  )}
                </div>

                {/* Indicador de similitud */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div 
                        className={`h-full transition-all ${
                          item.similarity >= 0.9 
                            ? 'bg-green-500' 
                            : item.similarity >= 0.75 
                            ? 'bg-blue-500' 
                            : item.similarity >= 0.6
                            ? 'bg-yellow-500'
                            : 'bg-neutral-400'
                        }`}
                        style={{ width: `${item.similarity * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {label} ({(item.similarity * 100).toFixed(0)}%)
                  </span>
                </div>

                {/* Vista previa del texto con Ver Más/Ver Menos */}
                {item.texto && (
                  <div className="mt-2 text-neutral-700 dark:text-neutral-300">
                    <p className={`text-sm leading-relaxed ${!isTextExpanded ? 'line-clamp-3' : ''}`}>
                      {item.texto}
                    </p>
                    {item.texto.length > 300 && (
                      <button
                        onClick={() => setExpandedText(prev => ({ ...prev, [item.id]: !isTextExpanded }))}
                        className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {isTextExpanded ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Botón para mostrar más/menos */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750"
        >
          {expanded 
            ? `Mostrar menos` 
            : `Mostrar ${filteredItems.length - maxItems} más`
          }
        </button>
      )}
    </div>
  );
}