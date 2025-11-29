"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import FlexSearch from 'flexsearch';

export interface ResolutionItem {
  id: string;
  titulo: string;
  texto: string;
  metadatos: {
    expediente?: string;
    resolucion?: string;
    fecha?: string;
    archivo_origen?: string;
  };
  vector?: number[];
}

interface SearchContextType {
  indexReady: boolean;
  searchResults: ResolutionItem[];
  lastSearchQuery: string | null;
  setLastSearchQuery: (q: string | null) => void;
  search: (query: string, limit?: number) => void;
  allItems: ResolutionItem[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearchIndex() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('SearchContext not found');
  return ctx;
}

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [indexReady, setIndexReady] = useState(false);
  const [searchResults, setSearchResults] = useState<ResolutionItem[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<ResolutionItem[]>([]);
  const indexRef = useRef<any>(null);

  // Cargar datos e inicializar índice FlexSearch
  useEffect(() => {
    async function loadData() {
      if (indexRef.current) return;
      const res = await fetch('/indice-resoluciones-prodhab.json');
      const json = await res.json();
      const items: ResolutionItem[] = Array.isArray(json.datos)
        ? json.datos.filter((d: any) => d && d.id && d.titulo && d.texto)
        : [];
      setAllItems(items);
      // Construir índice de documentos FlexSearch
      const idx = new FlexSearch.Document({
        tokenize: 'forward',
        cache: true,
        document: {
          id: 'id',
          index: ['titulo', 'texto']
        }
      });
      items.forEach(item => idx.add({
        id: item.id,
        titulo: item.titulo,
        texto: item.texto
      }));
      indexRef.current = idx;
      setIndexReady(true);
    }
    loadData();
  }, []);

  // Función de búsqueda
  const search = useCallback((query: string, limit: number = 10) => {
    if (!indexRef.current || !query) {
      setSearchResults([]);
      return;
    }
    // La búsqueda de documentos FlexSearch devuelve un array de objetos con el campo result
    let results = indexRef.current.search(query, { limit });
    if (Array.isArray(results)) {
      results = results.flatMap((r: any) => r.result || []);
    }
    // Mapear ids a items
    const found = allItems.filter(item => results.includes(item.id));
    setSearchResults(found);
  }, [allItems]);

  return (
    <SearchContext.Provider value={{ indexReady, searchResults, lastSearchQuery, setLastSearchQuery, search, allItems }}>
      {children}
    </SearchContext.Provider>
  );
};
