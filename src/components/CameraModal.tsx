import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { t } from '../constants/i18n';

interface CameraModalProps {
  language: Language;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraModal({ language, onCapture, onClose }: CameraModalProps) {
  const tr = t(language);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [captured, setCaptured] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    stream?.getTracks().forEach(t => t.stop());
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
      setError(null);
    } catch {
      setError(tr.errors.camera);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [startCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stream?.getTracks().forEach(t => t.stop());
  };

  const handleConfirm = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(blob => {
      if (blob) onCapture(new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="camera-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            <Camera className="w-4 h-4" />
            {tr.upload.camera}
          </span>
          <button className="icon-btn" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="camera-viewport">
          {error ? (
            <div className="camera-error">
              <AlertCircle className="w-8 h-8 mb-2" />
              {error}
            </div>
          ) : captured ? (
            <img src={captured} alt="Captured" className="camera-preview" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="camera-video" />
          )}
          <canvas ref={canvasRef} className="sr-only" />
        </div>

        <div className="camera-controls">
          {captured ? (
            <>
              <button className="btn btn-secondary" onClick={handleRetake}>
                <RefreshCw className="w-4 h-4" />
                Переснять
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                <Camera className="w-4 h-4" />
                Использовать
              </button>
            </>
          ) : (
            <>
              <button className="icon-btn icon-btn--lg" onClick={() => setFacingMode(p => p === 'environment' ? 'user' : 'environment')} title="Flip">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="shutter-btn" onClick={handleCapture} disabled={!!error}>
                <span className="shutter-inner" />
              </button>
              <div style={{ width: 48 }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
