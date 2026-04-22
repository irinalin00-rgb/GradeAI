import React, { useRef, useState } from 'react';
import { ArrowLeft, Download, BookOpen, CheckCircle2, XCircle, MinusCircle, Loader2, X, AlertCircle } from 'lucide-react';
import { AnalysisResult, Language } from '../types';
import { t } from '../constants/i18n';
import ScoreRing from './ScoreRing';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface ResultViewProps {
  result: AnalysisResult;
  language: Language;
  onBack: () => void;
  onUpdate: (r: AnalysisResult) => void;
  onGenerateTasks: (r: AnalysisResult) => Promise<string[]>;
}

export default function ResultView({ result, language, onBack, onUpdate, onGenerateTasks }: ResultViewProps) {
  const tr = t(language);
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    try {
      const tasks = await onGenerateTasks(result);
      onUpdate({ ...result, adaptiveTasks: tasks });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const img = await toPng(printRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      const props = pdf.getImageProperties(img);
      const totalH = (props.height * w) / props.width;
      let left = totalH;
      let pos = 0;
      pdf.addImage(img, 'PNG', 0, pos, w, totalH);
      left -= h;
      while (left > 0) {
        pos -= h;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, pos, w, totalH);
        left -= h;
      }
      pdf.save(`${result.studentName}_${result.subject}.pdf`);
      const blob = pdf.output('blob');
      setPdfUrl(URL.createObjectURL(blob));
    } finally {
      setIsExporting(false);
    }
  };

  const dateStr = new Date(result.date).toLocaleString(
    language === 'ru' ? 'ru-RU' : language === 'kz' ? 'kk-KZ' : 'en-US',
    { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  return (
    <div className="result-page">
      {/* Toolbar */}
      <div className="result-toolbar">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          {tr.result.back}
        </button>
        <div className="result-toolbar-right">
          {!result.adaptiveTasks && (
            <button className="btn btn-secondary" onClick={handleGenerateTasks} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              {isGenerating ? tr.result.generating : tr.result.generateTasks}
            </button>
          )}
          <button className="btn btn-primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? tr.result.exporting : tr.result.exportPdf}
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="result-content">
        {/* Hero */}
        <div className="result-hero">
          <div className="result-hero-info">
            <div className="result-badge">{result.workType} · {result.subject} · {result.grade} класс</div>
            <h1 className="result-name">{result.studentName}</h1>
            <p className="result-date">{dateStr}</p>
          </div>
          <ScoreRing
            percentage={result.score.percentage}
            gradeLetter={result.gradeLetter}
            earned={result.score.earned}
            max={result.score.max}
          />
        </div>

        {/* Task Analysis */}
        <section className="result-section">
          <h2 className="section-title">{tr.result.analysis}</h2>
          <div className="task-list">
            {result.analysis.map((item, i) => (
              <div key={i} className={`task-item ${item.isCorrect ? 'task-item--correct' : item.points > 0 ? 'task-item--partial' : 'task-item--wrong'}`}>
                <div className="task-icon">
                  {item.isCorrect
                    ? <CheckCircle2 className="w-5 h-5" />
                    : item.points > 0
                    ? <MinusCircle className="w-5 h-5" />
                    : <XCircle className="w-5 h-5" />}
                </div>
                <div className="task-body">
                  <div className="task-header">
                    <span className="task-name">{item.task}</span>
                    <span className="task-score">{item.points}/{item.maxPoints}</span>
                  </div>
                  <p className="task-comment">{item.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SWOT */}
        <section className="result-section">
          <h2 className="section-title">{tr.result.swot}</h2>
          <div className="swot-grid">
            <div className="swot-card swot-card--strengths">
              <h3>{tr.result.strengths}</h3>
              <ul>{result.swot.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="swot-card swot-card--weaknesses">
              <h3>{tr.result.weaknesses}</h3>
              <ul>{result.swot.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="swot-card swot-card--opportunities">
              <h3>{tr.result.opportunities}</h3>
              <ul>{result.swot.opportunities.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="swot-card swot-card--threats">
              <h3>{tr.result.threats}</h3>
              <ul>{result.swot.threats.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="result-section">
          <h2 className="section-title">{tr.result.recommendations}</h2>
          <div className="recommendations">
            {result.recommendations.map((r, i) => (
              <div key={i} className="recommendation">
                <span className="rec-num">{i + 1}</span>
                <p>{r}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Adaptive Tasks */}
        {result.adaptiveTasks && (
          <section className="result-section">
            <h2 className="section-title section-title--accent">
              <BookOpen className="w-5 h-5" />
              {tr.result.adaptiveTasks}
            </h2>
            <div className="adaptive-tasks">
              {result.adaptiveTasks.map((task, i) => (
                <div key={i} className="adaptive-task">
                  <span className="adaptive-num">{i + 1}</span>
                  <p>{task}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* PDF Preview Modal */}
      {pdfUrl && (
        <div className="modal-backdrop" onClick={() => setPdfUrl(null)}>
          <div className="pdf-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title"><Download className="w-4 h-4" />{tr.result.exportPdf}</span>
              <button className="icon-btn" onClick={() => setPdfUrl(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="modal-notice">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Если скачивание не началось, воспользуйтесь кнопкой ниже.</span>
            </div>
            <iframe src={pdfUrl} className="pdf-iframe" title="PDF" />
            <div className="modal-footer">
              <a href={pdfUrl} download={`${result.studentName}.pdf`} className="btn btn-primary">
                <Download className="w-4 h-4" />Скачать файл
              </a>
              <button className="btn btn-ghost" onClick={() => setPdfUrl(null)}>
                {tr.result.back}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
