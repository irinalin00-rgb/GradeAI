import React, { useCallback, useRef, useState } from 'react';
import {
  Upload, Camera, FileImage, FileText, AlertCircle, Info,
  ClipboardPaste, Mic, MicOff, Loader2, ChevronDown, BookMarked, X,
} from 'lucide-react';
import { Language, UploadForm, WorkType } from '../types';
import { t } from '../constants/i18n';
import CameraModal from './CameraModal';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface UploadZoneProps {
  language:  Language;
  onAnalyze: (file: File | null, form: UploadForm) => void;
  isLoading: boolean;
}

const DEFAULT_FORM: UploadForm = {
  studentName: '', subject: '', workType: 'СОР',
  grade: '', maxScore: 20, studentWork: '', markScheme: '',
};

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

function FilePreview({ file, onClear }: { file: File; onClear: () => void }) {
  const isPdf = file.type === 'application/pdf';
  const url   = isPdf ? null : URL.createObjectURL(file);
  return (
    <div className="file-preview-wrap">
      {isPdf ? (
        <div className="pdf-preview-inner">
          <FileText className="w-10 h-10" style={{ color: '#EF4444' }} />
          <div className="pdf-preview-info">
            <span className="pdf-preview-name">{file.name}</span>
            <span className="pdf-preview-size">{(file.size / 1024).toFixed(0)} KB · PDF</span>
          </div>
        </div>
      ) : (
        <img src={url!} alt="Preview" className="preview-image" />
      )}
      <button className="preview-change" onClick={e => { e.stopPropagation(); onClear(); }}>
        <X className="w-3.5 h-3.5" /> Убрать
      </button>
    </div>
  );
}

export default function UploadZone({ language, onAnalyze, isLoading }: UploadZoneProps) {
  const tr           = t(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  const [file,       setFile]       = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [form,       setForm]       = useState<UploadForm>(DEFAULT_FORM);
  const [errors,     setErrors]     = useState<Partial<Record<keyof UploadForm | 'file', string>>>({});

  const handleTranscribed = useCallback((text: string) => {
    setForm(prev => {
      const sep = prev.studentWork && !prev.studentWork.endsWith('\n') ? ' ' : '';
      return { ...prev, studentWork: prev.studentWork + sep + text };
    });
  }, []);
  const { state: voiceState, duration, toggle: toggleVoice } = useVoiceInput(handleTranscribed);

  const setNewFile = (f: File) => {
    setFile(f);
    setErrors(prev => ({ ...prev, file: undefined }));
  };
  const clearFile = () => setFile(null);

  const update = (key: keyof UploadForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = key === 'maxScore' ? Number(e.target.value) : e.target.value;
      setForm(prev => ({ ...prev, [key]: val }));
      setErrors(prev => ({ ...prev, [key]: undefined }));
    };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.studentName.trim()) e.studentName = tr.errors.noName;
    if (!form.subject.trim())     e.subject     = tr.errors.noSubject;
    if (!file && !form.studentWork.trim()) e.file = 'Загрузите фото/PDF или введите ответы вручную';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) setNewFile(f);
  }, []);

  return (
    <>
      <div className="upload-page">
        <div className="alem-notice">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span><b>RAGFlow OCR → AlemLLM</b> — загрузите фото или PDF работы, система прочитает текст и проверит по марк-схеме.</span>
        </div>

        {/* ── MARK SCHEME ── */}
        <div className="mark-scheme-block">
          <div className="mark-scheme-header">
            <BookMarked className="w-4 h-4" />
            Марк-схема / критерии оценивания
            <span className="ms-optional">повышает точность проверки</span>
          </div>
          <textarea
            className="field-input field-textarea field-textarea--sm"
            placeholder={`Задание 1 (5 б): формула верная — 3 б, подстановка — 1 б, ответ с единицами — 1 б\nЗадание 2 (5 б): теорема Пифагора — 2 б, вычисления — 2 б, ответ — 1 б`}
            value={form.markScheme}
            onChange={update('markScheme')}
            rows={3}
          />
        </div>

        {/* ── DROP ZONE (photo + PDF) ── */}
        <div
          className={`dropzone dropzone--primary ${isDragging ? 'dropzone--dragging' : ''} ${file ? 'dropzone--has-file' : ''} ${errors.file ? 'dropzone--error' : ''}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef} type="file" accept={ACCEPT} className="sr-only"
            onChange={e => { const f = e.target.files?.[0]; if (f) setNewFile(f); }}
          />
          {file ? (
            <FilePreview file={file} onClear={clearFile} />
          ) : (
            <div className="dropzone-empty">
              <div className="dropzone-icon-row">
                <div className="dz-type-icon dz-type-icon--img">
                  <FileImage className="w-6 h-6" />
                </div>
                <div className="dz-type-sep" />
                <div className="dz-type-icon dz-type-icon--pdf">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <p className="dropzone-title">Фото или PDF работы ученика</p>
              <p className="dropzone-subtitle">RAGFlow прочитает текст автоматически (OCR + DeepDOC)</p>
              <div className="dropzone-divider"><span>или</span></div>
              <button className="btn btn-secondary"
                onClick={e => { e.stopPropagation(); setShowCamera(true); }}>
                <Camera className="w-4 h-4" /> Сфотографировать
              </button>
              <p className="dropzone-formats">JPG · PNG · WEBP · PDF до 20MB</p>
            </div>
          )}
        </div>
        {errors.file && <p className="field-error"><AlertCircle className="w-3.5 h-3.5" />{errors.file}</p>}

        {/* ── MANUAL FALLBACK ── */}
        <details className="photo-section" onToggle={e => setShowManual((e.target as HTMLDetailsElement).open)}>
          <summary className="photo-summary">
            <ChevronDown className={`w-4 h-4 transition-transform ${showManual ? 'rotate-180' : ''}`} />
            Нет файла? Введите ответы вручную
          </summary>
          <div style={{ padding: '0 16px 16px' }}>
            <div className="field" style={{ marginTop: 12 }}>
              <div className="field-label-row">
                <label className="field-label">Ответы ученика</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button"
                    className={`btn btn-sm ${voiceState === 'recording' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={toggleVoice} disabled={voiceState === 'transcribing'}>
                    {voiceState === 'recording'    ? <><MicOff className="w-4 h-4" /> Стоп · {duration}с</> :
                     voiceState === 'transcribing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Распознаю...</> :
                     <><Mic className="w-4 h-4" /> Голос</>}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
                    try { const t = await navigator.clipboard.readText();
                      setForm(p => ({ ...p, studentWork: t })); } catch {}
                  }}><ClipboardPaste className="w-3.5 h-3.5" /> Вставить</button>
                </div>
              </div>
              {voiceState === 'recording' && (
                <div className="voice-banner"><span className="voice-dot" /> Запись · {duration}с</div>
              )}
              <textarea
                ref={textareaRef}
                className="field-input field-textarea"
                placeholder={"Задание 1: ученик написал...\nЗадание 2: ..."}
                value={form.studentWork} onChange={update('studentWork')} rows={6}
              />
            </div>
          </div>
        </details>

        {/* ── FORM ── */}
        <div className="upload-form">
          <div className="form-row">
            <div className="field">
              <label className="field-label">{tr.upload.form.studentName} <span className="required">*</span></label>
              <input className={`field-input ${errors.studentName ? 'field-input--error' : ''}`}
                placeholder={tr.upload.form.studentNamePlaceholder}
                value={form.studentName} onChange={update('studentName')} />
              {errors.studentName && <p className="field-error"><AlertCircle className="w-3.5 h-3.5" />{errors.studentName}</p>}
            </div>
            <div className="field">
              <label className="field-label">{tr.upload.form.subject} <span className="required">*</span></label>
              <input className={`field-input ${errors.subject ? 'field-input--error' : ''}`}
                placeholder={tr.upload.form.subjectPlaceholder}
                value={form.subject} onChange={update('subject')} />
              {errors.subject && <p className="field-error"><AlertCircle className="w-3.5 h-3.5" />{errors.subject}</p>}
            </div>
          </div>
          <div className="form-row form-row--3">
            <div className="field">
              <label className="field-label">{tr.upload.form.workType}</label>
              <select className="field-input" value={form.workType} onChange={update('workType')}>
                {(Object.keys(tr.upload.workTypes) as WorkType[]).map(wt => (
                  <option key={wt} value={wt}>{tr.upload.workTypes[wt]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">{tr.upload.form.grade}</label>
              <input className="field-input" placeholder="9А" value={form.grade} onChange={update('grade')} />
            </div>
            <div className="field">
              <label className="field-label">{tr.upload.form.maxScore}</label>
              <input type="number" min={1} max={200} className="field-input"
                value={form.maxScore} onChange={update('maxScore')} />
            </div>
          </div>
          <button className="btn btn-primary btn-lg w-full"
            onClick={() => { if (validate()) onAnalyze(file, form); }}
            disabled={isLoading}>
            {isLoading ? <><span className="spinner" />{tr.upload.form.analyzing}</> :
              <><span style={{ fontSize: 18 }}>✦</span>{tr.upload.form.analyze}</>}
          </button>
        </div>
      </div>

      {showCamera && (
        <CameraModal language={language}
          onCapture={f => { setNewFile(f); setShowCamera(false); }}
          onClose={() => setShowCamera(false)} />
      )}
    </>
  );
}
