import React, { useState, useCallback } from 'react';
import { Language, View, AnalysisResult, UploadForm } from './types';
import { useAnalysis } from './hooks/useAnalysis';
import { useResults  } from './hooks/useResults';
import Header      from './components/Header';
import UploadZone  from './components/UploadZone';
import LoadingView from './components/LoadingView';
import ResultView  from './components/ResultView';
import HistoryView from './components/HistoryView';
import Dashboard   from './components/Dashboard';

export default function App() {
  const [language,     setLanguage]     = useState<Language>('ru');
  const [view,         setView]         = useState<View>('upload');
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);

  const { analyze, generateAdaptiveTasks, isLoading, loadingStep, loadingInfo, error } = useAnalysis();
  const { results, addResult, updateResult, removeResult, clearAll } = useResults();

  const handleAnalyze = useCallback(async (file: File | null, form: UploadForm) => {
    const result = await analyze(file, form, language);
    if (result) { addResult(result); setActiveResult(result); setView('result'); }
  }, [analyze, addResult, language]);

  const handleSelectResult = (r: AnalysisResult) => { setActiveResult(r); setView('result'); };
  const handleUpdateResult = (updated: AnalysisResult) => { updateResult(updated); setActiveResult(updated); };

  return (
    <div className="app">
      <Header view={view} setView={setView} language={language} setLanguage={setLanguage} resultCount={results.length} />
      <main className="main">
        {isLoading && <LoadingView language={language} step={loadingStep} loadingInfo={loadingInfo} />}
        {error && !isLoading && <div className="error-banner">⚠️ {error}</div>}

        {!isLoading && view === 'upload' && (
          <UploadZone language={language} onAnalyze={handleAnalyze} isLoading={isLoading} />
        )}
        {!isLoading && view === 'result' && activeResult && (
          <ResultView result={activeResult} language={language}
            onBack={() => { setActiveResult(null); setView('upload'); }}
            onUpdate={handleUpdateResult}
            onGenerateTasks={r => generateAdaptiveTasks(r, language)} />
        )}
        {view === 'history' && (
          <HistoryView results={results} language={language}
            onSelect={handleSelectResult} onRemove={removeResult} onClearAll={clearAll} />
        )}
        {view === 'dashboard' && (
          <Dashboard results={results} language={language} onSelect={handleSelectResult} />
        )}
      </main>
    </div>
  );
}
