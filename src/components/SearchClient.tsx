"use client";
import React, { useState } from 'react';
import { useSearchIndex } from '@/context/SearchContext';
import { SearchConfigPanel } from './SearchConfigPanel';
import { SearchResults } from './SearchResults';

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  const [relatedLimit, setRelatedLimit] = useState(5);
  const { allItems } = useSearchIndex();

  return (
    <div>
      <SearchConfigPanel
        limit={limit}
        setLimit={setLimit}
        similarityThreshold={similarityThreshold}
        setSimilarityThreshold={setSimilarityThreshold}
        relatedLimit={relatedLimit}
        setRelatedLimit={setRelatedLimit}
        onApply={() => {}}
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar..."
        className="mb-4 w-full px-3 py-2 border rounded"
      />
      <SearchResults
        query={query}
        limit={limit}
        similarityThreshold={similarityThreshold}
        relatedLimit={relatedLimit}
        filteredItems={allItems}
      />
    </div>
  );
}
