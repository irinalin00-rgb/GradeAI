import React from 'react';
import { Trash2, ChevronRight, FileText, AlertTriangle } from 'lucide-react';
import { AnalysisResult, Language, GradeLetter } from '../types';
import { t } from '../constants/i18n';

interface HistoryViewProps {
  results: AnalysisResult[];
  language: Language;
  onSelect: (r: AnalysisResult) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const GRADE_COLORS: Record<GradeLetter, string> = {
  A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f',
};

export default function HistoryView({ results, language, onSelect, onRemove, onClearAll }: HistoryViewProps) {
  const tr = t(language);

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <FileText className="w-12 h-12 mb-4 opacity-30" />
        <h3>{tr.history.empty}</h3>
        <p>{tr.history.emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">{tr.history.title}</h2>
        <button className="btn btn-ghost btn-sm text-red-500" onClick={onClearAll}>
          <Trash2 className="w-4 h-4" />
          {tr.history.clearAll}
        </button>
      </div>

      <div className="history-list">
        {results.map(r => (
          <div key={r.id} className="history-card" onClick={() => onSelect(r)}>
            <div className={`history-grade ${GRADE_COLORS[r.gradeLetter]}`}>
              {r.gradeLetter}
            </div>
            <div className="history-info">
              <p className="history-name">{r.studentName}</p>
              <p className="history-meta">{r.subject} · {r.workType} · {r.grade} класс</p>
              <p className="history-date">
                {new Date(r.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'kz' ? 'kk-KZ' : 'en-US')}
              </p>
            </div>
            <div className="history-score">
              <span className="history-score-val">{r.score.earned}/{r.score.max}</span>
              <span className="history-score-pct">{r.score.percentage}%</span>
            </div>
            <div className="history-actions">
              <button
                className="icon-btn icon-btn--sm"
                onClick={e => { e.stopPropagation(); onRemove(r.id); }}
                title="Remove"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
