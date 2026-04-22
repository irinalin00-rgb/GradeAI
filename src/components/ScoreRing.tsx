import React from 'react';
import { GradeLetter } from '../types';

interface ScoreRingProps {
  percentage: number;
  gradeLetter: GradeLetter;
  earned: number;
  max: number;
  size?: number;
}

const GRADE_COLORS: Record<GradeLetter, string> = {
  A: '#059669',
  B: '#0EA5E9',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444',
};

export default function ScoreRing({ percentage, gradeLetter, earned, max, size = 160 }: ScoreRingProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percentage / 100) * circumference;
  const color = GRADE_COLORS[gradeLetter];

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="ring-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="ring-inner">
        <span className="ring-grade" style={{ color }}>{gradeLetter}</span>
        <span className="ring-score">{earned}/{max}</span>
        <span className="ring-pct">{percentage}%</span>
      </div>
    </div>
  );
}
