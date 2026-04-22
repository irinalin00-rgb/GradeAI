export type Language    = 'ru' | 'kz' | 'en';
export type View        = 'upload' | 'result' | 'history' | 'dashboard';
export type WorkType    = 'СОР' | 'СОЧ' | 'other';
export type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'F';
export type ClassLevel  = 'high' | 'mid' | 'low';

export interface TaskAnalysis {
  task:      string;
  points:    number;
  maxPoints: number;
  isCorrect: boolean;
  comment:   string;
  topic?:    string;
  error?:    string; // specific error description when incorrect
}

export interface SwotData {
  strengths:     string[];
  weaknesses:    string[];
  opportunities: string[];
  threats:       string[];
}

export interface AnalysisResult {
  id:          string;
  date:        string;
  studentName: string;
  subject:     string;
  workType:    WorkType;
  grade:       string;
  imageUrl?:   string;
  score: { earned: number; max: number; percentage: number };
  gradeLetter:     GradeLetter;
  analysis:        TaskAnalysis[];
  swot:            SwotData;
  recommendations: string[];
  adaptiveTasks?:  string[];
  topicScores?:    Record<string, { earned: number; max: number }>;
}

export interface UploadForm {
  studentName: string;
  subject:     string;
  workType:    WorkType;
  grade:       string;
  maxScore:    number;
  studentWork: string;
  markScheme:  string;
}

// ─── Aggregated error entry ───────────────────────────────────────────────────
export interface ClassError {
  text:      string;         // full error description
  count:     number;         // how many students made this error
  students:  string[];       // which students
  topic?:    string;         // subject topic if known
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export interface ClassStats {
  total:       number;
  avgPct:      number;
  level:       ClassLevel;
  passing:     number;
  failing:     number;
  gradeCount:  Record<GradeLetter, number>;
  sorAvg:      number | null;
  sochAvg:     number | null;
  topErrors:   ClassError[];
  topicGaps:   { topic: string; avgPct: number; count: number }[];
  students:    {
    name: string; pct: number; grade: GradeLetter;
    subject: string; workType: WorkType; date: string;
    errorCount: number;
  }[];
}

// ─── Normalise error text for grouping ───────────────────────────────────────
function normaliseError(s: string): string {
  return s.toLowerCase()
    .replace(/[«»"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function computeClassStats(results: AnalysisResult[]): ClassStats {
  const n = results.length;
  if (n === 0) return {
    total: 0, avgPct: 0, level: 'low', passing: 0, failing: 0,
    gradeCount: { A:0,B:0,C:0,D:0,F:0 },
    sorAvg: null, sochAvg: null, topErrors: [], topicGaps: [], students: [],
  };

  const avgPct = Math.round(results.reduce((s,r) => s + r.score.percentage, 0) / n);
  const level: ClassLevel = avgPct >= 75 ? 'high' : avgPct >= 50 ? 'mid' : 'low';
  const gradeCount: Record<GradeLetter, number> = { A:0,B:0,C:0,D:0,F:0 };
  results.forEach(r => { gradeCount[r.gradeLetter]++; });

  const avg = (arr: AnalysisResult[]) =>
    arr.length ? Math.round(arr.reduce((s,r) => s+r.score.percentage,0)/arr.length) : null;

  // ── Error aggregation ────────────────────────────────────────────────────────
  // Map: normalised key → { text, count, students, topic }
  const errMap = new Map<string, ClassError>();

  const addError = (rawText: string, student: string, topic?: string) => {
    if (!rawText.trim()) return;
    const key = normaliseError(rawText);
    if (!errMap.has(key)) {
      errMap.set(key, { text: capitalize(rawText.trim()), count: 0, students: [], topic });
    }
    const entry = errMap.get(key)!;
    entry.count++;
    if (!entry.students.includes(student)) entry.students.push(student);
  };

  results.forEach(r => {
    // From SWOT weaknesses
    r.swot.weaknesses.forEach(w => addError(w, r.studentName));
    // From failed / partial tasks
    r.analysis.forEach(a => {
      if (!a.isCorrect) {
        if (a.error) addError(a.error, r.studentName, a.topic);
        else if (a.comment) addError(a.comment, r.studentName, a.topic);
      }
    });
  });

  const topErrors = Array.from(errMap.values())
    .filter(e => e.text.length > 5)
    .sort((a,b) => b.count - a.count || b.students.length - a.students.length)
    .slice(0, 12);

  // ── Topic gaps ───────────────────────────────────────────────────────────────
  const topicMap = new Map<string, { earned:number; max:number; count:number }>();
  results.forEach(r => {
    if (r.topicScores) {
      Object.entries(r.topicScores).forEach(([t,s]) => {
        const p = topicMap.get(t) ?? { earned:0, max:0, count:0 };
        topicMap.set(t, { earned:p.earned+s.earned, max:p.max+s.max, count:p.count+1 });
      });
    }
  });
  const topicGaps = Array.from(topicMap.entries())
    .map(([topic,s]) => ({ topic, avgPct: Math.round((s.earned/s.max)*100), count: s.count }))
    .sort((a,b) => a.avgPct - b.avgPct)
    .slice(0, 8);

  // ── Student list ─────────────────────────────────────────────────────────────
  const students = results.map(r => ({
    name:       r.studentName,
    pct:        r.score.percentage,
    grade:      r.gradeLetter,
    subject:    r.subject,
    workType:   r.workType,
    date:       r.date,
    errorCount: r.analysis.filter(a => !a.isCorrect).length,
  })).sort((a,b) => b.pct - a.pct);

  return {
    total: n, avgPct, level,
    passing: results.filter(r => r.score.percentage >= 40).length,
    failing:  results.filter(r => r.score.percentage <  40).length,
    gradeCount,
    sorAvg:  avg(results.filter(r => r.workType==='СОР')),
    sochAvg: avg(results.filter(r => r.workType==='СОЧ')),
    topErrors, topicGaps, students,
  };
}
