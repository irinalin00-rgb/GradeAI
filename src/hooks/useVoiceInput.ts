import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from './useAnalysis';

export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'error';

export function useVoiceInput(onResult: (text: string) => void) {
  const [state,    setState]    = useState<VoiceState>('idle');
  const [duration, setDuration] = useState(0);
  const mediaRef   = useRef<MediaRecorder | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setState('transcribing');
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const text = await transcribeAudio(blob);
          onResult(text);
          setState('idle');
        } catch {
          setState('error');
          setTimeout(() => setState('idle'), 2500);
        }
      };

      mr.start(200);
      mediaRef.current = mr;
      setState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(d => {
          // Auto-stop after 60s
          if (d >= 60) { stop(); return d; }
          return d + 1;
        });
      }, 1000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2500);
    }
  }, [onResult]);

  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.stop();
    }
  }, []);

  const toggle = useCallback(() => {
    if (state === 'recording') stop();
    else if (state === 'idle') start();
  }, [state, start, stop]);

  return { state, duration, toggle };
}
