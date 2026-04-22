import { useState, useCallback } from 'react';
import { AnalysisResult, Language, UploadForm } from '../types';
import { extractTextFromFile } from './useRAGFlow';

const LLM_BASE = 'https://llm.alem.ai/v1';
const LLM_KEY  = process.env.ALEM_API_KEY ?? '';
const MODEL    = 'alemllm';

async function alemChat(messages: object[]): Promise<string> {
  const res = await fetch(`${LLM_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.1, max_tokens: 3500 }),
  });
  if (!res.ok) throw new Error(`AlemLLM ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  return (await res.json()).choices?.[0]?.message?.content ?? '';
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', blob, 'audio.webm');
  form.append('model', 'whisper-1');
  const res = await fetch(`${LLM_BASE}/audio/transcriptions`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${LLM_KEY}` }, body: form,
  });
  if (!res.ok) throw new Error(`Whisper ${res.status}`);
  return (await res.json()).text ?? '';
}

function extractJSON(raw: string): string {
  const clean = raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
  return clean.match(/\{[\s\S]*\}/)?.[0] ?? clean.match(/\[[\s\S]*\]/)?.[0] ?? clean;
}

function buildGradingPrompt(form: UploadForm, lang: Language, docText: string): string {
  const langName = { ru: 'Russian', kz: 'Kazakh', en: 'English' }[lang];
  const workText = docText || form.studentWork || '(no text provided)';
  const markPart = form.markScheme.trim()
    ? `\nMARK SCHEME (use strictly for grading each task):\n"""\n${form.markScheme}\n"""\n` : '';

  return `You are an expert ${form.subject} teacher in Kazakhstan.

STUDENT: ${form.studentName} | Subject: ${form.subject} | Type: ${form.workType} | Class: ${form.grade} | Max score: ${form.maxScore}
${markPart}
STUDENT'S WORK TEXT (extracted via OCR or entered manually):
"""
${workText}
"""

GRADING RULES:
1. Identify every task/question. Assign points using mark scheme if provided.
2. Total earned MUST NOT exceed ${form.maxScore}.
3. For each incorrect/partial task: describe the SPECIFIC error clearly (not vague).
4. Identify the topic/theme for each task.
5. Grade: A=90-100%, B=75-89%, C=60-74%, D=40-59%, F=0-39%
6. ALL output text in ${langName}.

RESPOND WITH ONLY VALID JSON — no markdown:
{
  "score": { "earned": <n>, "max": ${form.maxScore}, "percentage": <0-100> },
  "gradeLetter": "<A|B|C|D|F>",
  "analysis": [
    {
      "task": "<task name>",
      "points": <earned>,
      "maxPoints": <max for this task>,
      "isCorrect": <bool>,
      "comment": "<teacher feedback in ${langName}>",
      "topic": "<math topic or subject area>",
      "error": "<specific error description if incorrect, empty string if correct>"
    }
  ],
  "topicScores": { "<topic>": { "earned": <n>, "max": <n> } },
  "swot": {
    "strengths":     ["<3 specific strengths in ${langName}>"],
    "weaknesses":    ["<3 specific weaknesses in ${langName}>"],
    "opportunities": ["<2>"],
    "threats":       ["<2>"]
  },
  "recommendations": ["<rec1 in ${langName}>", "<rec2>", "<rec3>"]
}`;
}

function buildAdaptivePrompt(result: AnalysisResult, lang: Language): string {
  const langName = { ru: 'Russian', kz: 'Kazakh', en: 'English' }[lang];
  const failed = result.analysis.filter(a => !a.isCorrect)
    .map(a => `${a.task}: ${a.error || a.comment}`).join('\n') || '—';
  return `${result.subject} teacher. Create 3 adaptive remedial tasks.
Student: ${result.studentName}, class ${result.grade}
Score: ${result.score.earned}/${result.score.max} (${result.score.percentage}%)
Specific errors:\n${failed}
Weaknesses: ${result.swot.weaknesses.join('; ')}
Language: ${langName}. Slightly easier. Full task text with clear instructions.
JSON array only: ["<task1>", "<task2>", "<task3>"]`;
}

export type LoadingInfo = { step: number; label: string; pct?: number };

export function useAnalysis() {
  const [isLoading,   setIsLoading]   = useState(false);
  const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ step: 0, label: '' });
  const [error,       setError]       = useState<string | null>(null);

  const setStep = (step: number, label: string, pct?: number) =>
    setLoadingInfo({ step, label, pct });

  const analyze = useCallback(async (
    file: File | null, form: UploadForm, lang: Language,
  ): Promise<AnalysisResult | null> => {
    setIsLoading(true); setError(null);
    try {
      let docText = '';
      if (file) {
        setStep(1, 'Создаю рабочее пространство...');
        docText = await extractTextFromFile(file, (label, pct) => {
          const s = label.includes('рабочее') ? 1
                  : label.includes('Загружаю') ? 2 : 3;
          setStep(s, label, pct);
        });
      }
      setStep(4, 'AlemLLM анализирует работу...');
      const raw = await alemChat([
        { role: 'system', content: 'Professional teacher in Kazakhstan. JSON only, no markdown.' },
        { role: 'user',   content: buildGradingPrompt(form, lang, docText) },
      ]);
      setStep(5, 'Готово!');
      await new Promise(r => setTimeout(r, 300));

      const parsed = JSON.parse(extractJSON(raw)) as Omit<
        AnalysisResult,'id'|'date'|'studentName'|'subject'|'workType'|'grade'|'imageUrl'
      >;
      parsed.score.percentage = Math.round((parsed.score.earned / parsed.score.max) * 100);

      return {
        ...parsed,
        id:          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date:        new Date().toISOString(),
        studentName: form.studentName,
        subject:     form.subject,
        workType:    form.workType,
        grade:       form.grade,
        imageUrl:    file ? URL.createObjectURL(file) : undefined,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
      setLoadingInfo({ step: 0, label: '' });
    }
  }, []);

  const generateAdaptiveTasks = useCallback(async (
    result: AnalysisResult, lang: Language,
  ): Promise<string[]> => {
    const raw = await alemChat([
      { role: 'system', content: 'Teacher. JSON array only.' },
      { role: 'user',   content: buildAdaptivePrompt(result, lang) },
    ]);
    return JSON.parse(extractJSON(raw)) as string[];
  }, []);

  return {
    analyze, generateAdaptiveTasks,
    isLoading, loadingStep: loadingInfo.step, loadingInfo, error,
  };
}
