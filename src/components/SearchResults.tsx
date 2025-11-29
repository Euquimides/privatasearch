import React, { useState } from "react";
import { useSearchIndex, ResolutionItem } from "@/context/SearchContext";
import { findMostSimilar } from "@/utils/semanticSimilarity";
import { RelatedResolutions } from "./RelatedResolutions";
import { FileText, Calendar, Hash, ChevronRight, Sparkles, Download } from "lucide-react";

interface SearchResultsProps {
  query: string;
  limit: number;
  similarityThreshold: number;
  relatedLimit: number;
  filteredItems: ResolutionItem[];
}

export function SearchResults({
  query,
  limit,
  similarityThreshold,
  relatedLimit,
  filteredItems,
}: SearchResultsProps) {
  const { indexReady } = useSearchIndex();
  const [expandedResults, setExpandedResults] = useState<Set<string>>(
    new Set()
  );

  const searchResults = React.useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return filteredItems
      .filter(
        (item) =>
          item.titulo.toLowerCase().includes(lowerQuery) ||
          item.texto.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  }, [query, filteredItems, limit]);

  const toggleExpanded = (id: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!indexReady) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-12 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative mb-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
          Preparando búsqueda
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Cargando índice...
        </p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-gradient-to-br from-blue-50 to-neutral-50 p-12 text-center dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Comienza tu búsqueda
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Ingresa términos de búsqueda para encontrar resoluciones relevantes
        </p>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          No se encontraron resultados
        </h3>
        <p className="mb-1 text-neutral-600 dark:text-neutral-400">
          No hay coincidencias para{" "}
          <span className="font-semibold">"{query}"</span>
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500">
          Intenta con otros términos o ajusta los filtros de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sumario de Resultados */}
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <span className="text-lg font-bold">{searchResults.length}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {searchResults.length === 1
                ? "Resultado encontrado"
                : "Resultados encontrados"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Búsqueda: "{query}"
            </p>
          </div>
        </div>
        {/* Botones Expandir/Colapsar Todos */}
        {searchResults.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setExpandedResults(new Set(searchResults.map((item) => item.id)))}
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
              Ver todos
            </button>
            <button
              onClick={() => setExpandedResults(new Set())}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Colapsar todos
            </button>
          </div>
        )}
      </div>

      {/* Cuadrícula de Resultados */}
      <div className="space-y-4">
        {searchResults.map((item, index) => {
          const isExpanded = expandedResults.has(item.id);

          let related: { item: ResolutionItem; similarity: number }[] = [];
          if (item.vector) {
            related = findMostSimilar(
              item.vector,
              filteredItems.filter((i) => i.id !== item.id),
              relatedLimit,
              0.6,
              similarityThreshold
            );
          }

          return (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
            >
              {/* Acento de gradiente */}
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-green-500"></div>

              <div className="p-6 pl-8">
                {/* Encabezado con etiquetas */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Botón de descarga minimalista - Arriba a la derecha */}
                  {item.metadatos?.archivo_origen && (
                    <a
                      href={item.metadatos.archivo_origen}
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
                
                {/* Etiquetas de Metadatos */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {item.metadatos?.expediente && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      Exp: {item.metadatos.expediente}
                    </span>
                  )}
                  {item.metadatos?.resolucion && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      Res: {item.metadatos.resolucion}
                    </span>
                  )}
                  {item.metadatos?.fecha && (
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {item.metadatos.fecha}
                    </span>
                  )}
                </div>

                <div className="mb-4 text-neutral-700 dark:text-neutral-300">
                  <p
                    className={`leading-relaxed ${
                      !isExpanded ? "line-clamp-3" : ""
                    }`}
                  >
                    {isExpanded ? item.texto : item.texto.slice(0, 300)}
                    {!isExpanded && item.texto.length > 300 && "..."}
                  </p>
                  {item.texto.length > 300 && (
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {isExpanded ? "Ver menos" : "Ver más"}
                    </button>
                  )}
                </div>

                {/* Resoluciones relacionadas con Ver Más/Ver Menos */}
                {related.length > 0 && (
                  <div className="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
                    <RelatedResolutions
                      items={related.map((r) => ({
                        id: r.item.id,
                        titulo: r.item.titulo,
                        expediente: r.item.metadatos?.expediente,
                        resolucion: r.item.metadatos?.resolucion,
                        date: r.item.metadatos?.fecha,
                        similarity: r.similarity,
                        texto: r.item.texto,
                        archivo_origen: r.item.metadatos?.archivo_origen,
                      }))}
                      minSimilarity={similarityThreshold}
                      maxItems={relatedLimit}
                      showVisualization={true}
                    />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}