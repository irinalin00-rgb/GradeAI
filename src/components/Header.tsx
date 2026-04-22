import React from 'react';
import { Sparkles, BarChart3, History, Upload } from 'lucide-react';
import { Language, View } from '../types';
import { t } from '../constants/i18n';

interface HeaderProps {
  view: View;
  setView: (v: View) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  resultCount: number;
}

const LANGS: Language[] = ['ru', 'kz', 'en'];
const LANG_LABELS: Record<Language, string> = { ru: 'РУ', kz: 'ҚЗ', en: 'EN' };

export default function Header({ view, setView, language, setLanguage, resultCount }: HeaderProps) {
  const tr = t(language);

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: tr.nav.upload, icon: <Upload className="w-4 h-4" /> },
    { id: 'history', label: tr.nav.history, icon: <History className="w-4 h-4" /> },
    { id: 'dashboard', label: tr.nav.dashboard, icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <button onClick={() => setView('upload')} className="logo-btn">
          <div className="logo-icon">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="logo-text">{tr.appName}</span>
        </button>

        {/* Nav */}
        <nav className="nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`nav-item ${view === item.id || (view === 'result' && item.id === 'upload') ? 'nav-item--active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'history' && resultCount > 0 && (
                <span className="nav-badge">{resultCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Language switcher */}
        <div className="lang-switcher">
          {LANGS.map(l => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`lang-btn ${language === l ? 'lang-btn--active' : ''}`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
