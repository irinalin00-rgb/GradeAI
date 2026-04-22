import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  TrendingUp, Users, Award, AlertTriangle, BarChart3,
  ChevronUp, ChevronDown, Minus, AlertCircle, BookOpen,
} from 'lucide-react';
import { AnalysisResult, Language, GradeLetter, computeClassStats } from '../types';
import { t } from '../constants/i18n';

interface DashboardProps {
  results:  AnalysisResult[];
  language: Language;
  onSelect: (r: AnalysisResult) => void;
}

const GRADE_COLOR: Record<GradeLetter, string> = {
  A:'#059669', B:'#0EA5E9', C:'#F59E0B', D:'#F97316', F:'#EF4444',
};
const LEVEL_CFG = {
  high: { label:'Высокий уровень', color:'#059669', bg:'#ECFDF5', border:'#BBF7D0' },
  mid:  { label:'Средний уровень',  color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
  low:  { label:'Низкий уровень',   color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
};

type Tab = 'overview' | 'errors' | 'students' | 'sorvsoch';

// Max students per class
const MAX_STUDENTS = 16;

export default function Dashboard({ results, language, onSelect }: DashboardProps) {
  const tr   = t(language);
  const [tab, setTab] = useState<Tab>('overview');

  const stats = useMemo(() => computeClassStats(results), [results]);

  if (!results.length) {
    return (
      <div className="empty-state">
        <BarChart3 className="w-12 h-12 mb-4 opacity-30" />
        <h3>{tr.dashboard.empty}</h3>
        <p>{tr.dashboard.emptyHint}</p>
      </div>
    );
  }

  const lvl = LEVEL_CFG[stats.level];
  const pieData = (Object.entries(stats.gradeCount) as [GradeLetter,number][])
    .filter(([,v]) => v > 0).map(([name,value]) => ({ name, value }));

  const qualityPct  = Math.round(((stats.gradeCount.A+stats.gradeCount.B)/stats.total)*100);
  const satisfPct   = Math.round((stats.gradeCount.C/stats.total)*100);
  const failPct     = Math.round(((stats.gradeCount.D+stats.gradeCount.F)/stats.total)*100);

  // Capacity bar for class (up to MAX_STUDENTS)
  const classFill = Math.min(stats.total, MAX_STUDENTS);

  const tabs: { id:Tab; label:string }[] = [
    { id:'overview',  label:'Обзор' },
    { id:'errors',    label:`Ошибки (${stats.topErrors.length})` },
    { id:'students',  label:`Ученики (${stats.total}/${MAX_STUDENTS})` },
    { id:'sorvsoch',  label:'СОР / СОЧ' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h2 className="page-title">{tr.dashboard.title}</h2>
        <div className="level-badge"
          style={{ background:lvl.bg, border:`1.5px solid ${lvl.border}`, color:lvl.color }}>
          {stats.level==='high' ? <ChevronUp className="w-3.5 h-3.5"/> :
           stats.level==='low'  ? <ChevronDown className="w-3.5 h-3.5"/> :
           <Minus className="w-3.5 h-3.5"/>}
          {lvl.label}
        </div>
      </div>

      {/* Class capacity */}
      <div className="capacity-card">
        <div className="capacity-header">
          <span className="capacity-label">Заполненность класса</span>
          <span className="capacity-val">{stats.total} / {MAX_STUDENTS} учеников</span>
        </div>
        <div className="capacity-track">
          {Array.from({ length: MAX_STUDENTS }).map((_, i) => (
            <div key={i} className={`capacity-cell ${i < classFill ? 'capacity-cell--filled' : ''}`}
              style={{ background: i < classFill
                ? (stats.students[i]?.pct >= 75 ? '#059669'
                  : stats.students[i]?.pct >= 40 ? '#F59E0B' : '#EF4444')
                : undefined }} />
          ))}
        </div>
        <div className="capacity-legend">
          <span><span className="cap-dot" style={{background:'#059669'}}/>A+B</span>
          <span><span className="cap-dot" style={{background:'#F59E0B'}}/>C+D</span>
          <span><span className="cap-dot" style={{background:'#EF4444'}}/>F</span>
          <span><span className="cap-dot" style={{background:'var(--border)'}}/>Не проверено</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue"><Users className="w-5 h-5"/></div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">{tr.dashboard.totalChecked}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--purple"><TrendingUp className="w-5 h-5"/></div>
          <div className="stat-value">{stats.avgPct}%</div>
          <div className="stat-label">{tr.dashboard.avgScore}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--green"><Award className="w-5 h-5"/></div>
          <div className="stat-value">{stats.passing}</div>
          <div className="stat-label">{tr.dashboard.passing}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--red"><AlertTriangle className="w-5 h-5"/></div>
          <div className="stat-value">{stats.failing}</div>
          <div className="stat-label">{tr.dashboard.failing}</div>
        </div>
      </div>

      {/* Quality bar */}
      <div className="quality-bar-card">
        <div className="quality-bar-header">
          <span className="quality-bar-title">Качество знаний класса</span>
          <div className="quality-legend">
            <span className="ql-dot" style={{background:'#059669'}}/>Высокий · {qualityPct}%
            <span className="ql-dot" style={{background:'#F59E0B',marginLeft:10}}/>Достаточный · {satisfPct}%
            <span className="ql-dot" style={{background:'#EF4444',marginLeft:10}}/>Низкий · {failPct}%
          </div>
        </div>
        <div className="quality-track">
          <div className="quality-fill" style={{width:`${qualityPct}%`,background:'#059669'}}/>
          <div className="quality-fill" style={{width:`${satisfPct}%`,background:'#F59E0B'}}/>
          <div className="quality-fill" style={{width:`${failPct}%`, background:'#EF4444'}}/>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        {tabs.map(tb => (
          <button key={tb.id}
            className={`dash-tab ${tab===tb.id?'dash-tab--active':''}`}
            onClick={() => setTab(tb.id)}>{tb.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">{tr.dashboard.scoreChart}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.students.map(s=>({name:s.name.split(' ')[0],score:s.pct}))}
                margin={{top:4,right:8,left:-24,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{fontSize:11}}/>
                <YAxis domain={[0,100]} tick={{fontSize:11}}/>
                <Tooltip formatter={(v:number)=>[`${v}%`,'']}/>
                <Bar dataKey="score" radius={[4,4,0,0]}>
                  {stats.students.map((s,i)=>(
                    <Cell key={i} fill={s.pct>=75?'#059669':s.pct>=40?'#F59E0B':'#EF4444'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">{tr.dashboard.gradeChart}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={72} innerRadius={40}
                  dataKey="value" paddingAngle={3}
                  label={({name,value})=>`${name}:${value}`} labelLine={false}>
                  {pieData.map((e,i)=>(
                    <Cell key={i} fill={GRADE_COLOR[e.name as GradeLetter]}/>
                  ))}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Topic breakdown (if any) */}
          {stats.topicGaps.length > 0 && (
            <div className="chart-card chart-card--wide">
              <h3 className="chart-title">Результаты по темам</h3>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {stats.topicGaps.map((g,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:12,color:'var(--text-2)',width:140,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.topic}</span>
                    <div style={{flex:1,height:10,background:'var(--border)',borderRadius:999,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:999,background:g.avgPct>=75?'#059669':g.avgPct>=40?'#F59E0B':'#EF4444',width:`${g.avgPct}%`,transition:'width .5s'}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--text)',minWidth:36,textAlign:'right'}}>{g.avgPct}%</span>
                    <span style={{fontSize:11,color:'var(--text-3)',minWidth:40}}>({g.count} уч.)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ERRORS ── */}
      {tab === 'errors' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {stats.topErrors.length === 0 ? (
            <div className="empty-state" style={{minHeight:200}}>
              <AlertCircle className="w-8 h-8 mb-2 opacity-30"/>
              <p>Ошибок пока нет — проверьте хотя бы одну работу</p>
            </div>
          ) : stats.topErrors.map((err, i) => (
            <div key={i} className="error-card">
              <div className="error-card-header">
                <span className="error-card-rank">{i+1}</span>
                <div className="error-card-info">
                  <p className="error-card-text">{err.text}</p>
                  {err.topic && <span className="error-card-topic">{err.topic}</span>}
                </div>
                <div className="error-card-stats">
                  <span className="error-card-count">{err.count}×</span>
                  <span className="error-card-students">{err.students.length} уч.</span>
                </div>
              </div>
              {/* Bar showing frequency relative to max */}
              <div className="error-freq-track">
                <div className="error-freq-fill"
                  style={{width:`${Math.round((err.count/(stats.topErrors[0]?.count||1))*100)}%`}}/>
              </div>
              {/* Student list */}
              <div className="error-students-row">
                {err.students.slice(0,8).map((s,j) => (
                  <span key={j} className="error-student-chip">{s.split(' ')[0]}</span>
                ))}
                {err.students.length > 8 && (
                  <span className="error-student-chip error-student-chip--more">+{err.students.length-8}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STUDENTS ── */}
      {tab === 'students' && (
        <div className="chart-card" style={{padding:0,overflow:'hidden'}}>
          <table className="roster-table">
            <thead>
              <tr>
                <th>#</th><th>Ученик</th><th>Предмет</th><th>Тип</th>
                <th>Балл</th><th>Ошибок</th><th>Оценка</th><th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {stats.students.map((s,i) => (
                <tr key={i} className="roster-row" onClick={() => {
                  const r = results.find(r => r.studentName===s.name);
                  if (r) onSelect(r);
                }}>
                  <td className="roster-rank">{i+1}</td>
                  <td className="roster-name">{s.name}</td>
                  <td className="roster-meta">{s.subject}</td>
                  <td><span className="work-badge">{s.workType}</span></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div className="roster-bar-wrap">
                        <div className="roster-bar-fill"
                          style={{width:`${s.pct}%`,background:s.pct>=75?'#059669':s.pct>=40?'#F59E0B':'#EF4444'}}/>
                      </div>
                      <span className="roster-pct">{s.pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight:700, fontSize:13,
                      color: s.errorCount===0 ? '#059669' : s.errorCount<=2 ? '#D97706' : '#DC2626',
                    }}>{s.errorCount}</span>
                  </td>
                  <td>
                    <span className="grade-pill" style={{
                      background:`${GRADE_COLOR[s.grade]}18`,
                      color:GRADE_COLOR[s.grade],
                      border:`1px solid ${GRADE_COLOR[s.grade]}40`,
                    }}>{s.grade}</span>
                  </td>
                  <td className="roster-meta">
                    {new Date(s.date).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})}
                  </td>
                </tr>
              ))}
              {/* Empty slots up to 16 */}
              {Array.from({length: Math.max(0, MAX_STUDENTS - stats.total)}).map((_,i) => (
                <tr key={`empty-${i}`} style={{opacity:0.35}}>
                  <td className="roster-rank">{stats.total+i+1}</td>
                  <td colSpan={7} style={{fontSize:12,color:'var(--text-3)',fontStyle:'italic',padding:'8px 14px'}}>
                    — не проверено
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SOR vs SOCH ── */}
      {tab === 'sorvsoch' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="sorvsoch-grid">
            <div className="sorvsoch-card" style={{borderColor:'#BFDBFE'}}>
              <div className="sorvsoch-label" style={{color:'#0EA5E9'}}>СОР</div>
              <div className="sorvsoch-val">{stats.sorAvg!==null?`${stats.sorAvg}%`:'—'}</div>
              <div className="sorvsoch-sub">{results.filter(r=>r.workType==='СОР').length} работ</div>
            </div>
            <div className="sorvsoch-vs">vs</div>
            <div className="sorvsoch-card" style={{borderColor:'#C7D2FE'}}>
              <div className="sorvsoch-label" style={{color:'#5B4FE8'}}>СОЧ</div>
              <div className="sorvsoch-val">{stats.sochAvg!==null?`${stats.sochAvg}%`:'—'}</div>
              <div className="sorvsoch-sub">{results.filter(r=>r.workType==='СОЧ').length} работ</div>
            </div>
          </div>

          {(stats.sorAvg!==null||stats.sochAvg!==null) && (
            <div className="chart-card">
              <h3 className="chart-title">Средний балл СОР vs СОЧ</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[{name:'СОР',value:stats.sorAvg??0},{name:'СОЧ',value:stats.sochAvg??0}]}
                  margin={{top:4,right:8,left:-24,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                  <XAxis dataKey="name" tick={{fontSize:13}}/>
                  <YAxis domain={[0,100]} tick={{fontSize:11}}/>
                  <Tooltip formatter={(v:number)=>[`${v}%`,'Средний балл']}/>
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    <Cell fill="#0EA5E9"/><Cell fill="#5B4FE8"/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject breakdown */}
          {(() => {
            const subjects = [...new Set(results.map(r=>r.subject))];
            if (subjects.length < 2) return null;
            return (
              <div className="chart-card">
                <h3 className="chart-title">По предметам</h3>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {subjects.map(subj => {
                    const subRes = results.filter(r=>r.subject===subj);
                    const avg = Math.round(subRes.reduce((s,r)=>s+r.score.percentage,0)/subRes.length);
                    return (
                      <div key={subj} style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:12,color:'var(--text-2)',width:120,flexShrink:0}}>{subj}</span>
                        <div style={{flex:1,height:8,background:'var(--border)',borderRadius:999,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:999,background:avg>=75?'#059669':avg>=40?'#F59E0B':'#EF4444',width:`${avg}%`}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:600,color:'var(--text)',minWidth:34,textAlign:'right'}}>{avg}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
