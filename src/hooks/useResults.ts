import { useState, useEffect, useCallback } from 'react';
import { AnalysisResult } from '../types';

const STORAGE_KEY = 'gradeai_results';

export function useResults() {
  const [results, setResults] = useState<AnalysisResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      // Don't persist imageUrl (blob URLs don't survive page reload)
      const toStore = results.map(({ imageUrl: _, ...r }) => r);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [results]);

  const addResult = useCallback((result: AnalysisResult) => {
    setResults(prev => [result, ...prev]);
  }, []);

  const updateResult = useCallback((updated: AnalysisResult) => {
    setResults(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, []);

  const removeResult = useCallback((id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setResults([]);
  }, []);

  return { results, addResult, updateResult, removeResult, clearAll };
}
