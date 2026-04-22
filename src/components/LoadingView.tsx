import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { t } from '../constants/i18n';
import { LoadingInfo } from '../hooks/useAnalysis';

interface LoadingViewProps {
  language:    Language;
  step:        number;
  loadingInfo: LoadingInfo;
}

// 5 steps for the new pipeline
const STEPS = {
  ru: [
    'Создаю рабочее пространство',
    'Загружаю изображение в RAGFlow',
    'RAGFlow читает текст (OCR)',
    'AlemLLM анализирует работу',
    'Формирую результат',
  ],
  kz: [
    'Жұмыс кеңістігін жасаймын',
    'Суретті RAGFlow-ға жүктеймін',
    'RAGFlow мәтінді оқиды (OCR)',
    'AlemLLM жұмысты талдайды',
    'Нәтижені дайындаймын',
  ],
  en: [
    'Creating workspace',
    'Uploading image to RAGFlow',
    'RAGFlow reading text (OCR)',
    'AlemLLM analysing work',
    'Building result',
  ],
};

export default function LoadingView({ language, step, loadingInfo }: LoadingViewProps) {
  const steps = STEPS[language];
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loading-view">
      {/* Animated orb */}
      <div className="loading-orb">
        <div className="orb-ring orb-ring-1" />
        <div className="orb-ring orb-ring-2" />
        <div className="orb-ring orb-ring-3" />
        <div className="orb-core">
          <svg viewBox="0 0 24 24" fill="none" className="orb-icon">
            <path d="M12 2L2 7l10 5 10-5-10-5z"   stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5"              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M2 12l10 5 10-5"              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Dynamic label from RAGFlow */}
      {loadingInfo.label && (
        <p className="loading-live-label">
          {loadingInfo.label}{dots}
          {loadingInfo.pct !== undefined && loadingInfo.pct > 0 && (
            <span className="loading-pct"> {loadingInfo.pct}%</span>
          )}
        </p>
      )}

      {/* OCR progress bar */}
      {loadingInfo.pct !== undefined && step === 3 && (
        <div className="loading-progress">
          <div
            className="loading-progress-fill"
            style={{ width: `${loadingInfo.pct}%` }}
          />
        </div>
      )}

      {/* Steps list */}
      <div className="loading-steps">
        {steps.map((s, i) => {
          const idx    = i + 1;
          const done   = idx < step;
          const active = idx === step;
          return (
            <div key={i} className={`loading-step ${done ? 'loading-step--done' : active ? 'loading-step--active' : ''}`}>
              <div className="step-indicator">
                {done ? (
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                    <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : <span>{idx}</span>}
              </div>
              <span>{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
