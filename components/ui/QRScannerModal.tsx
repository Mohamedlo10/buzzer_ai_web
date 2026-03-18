'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, AlertCircle, QrCode } from 'lucide-react';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

function extractCode(raw: string): string {
  // Handle full URLs like https://buzzer-ai-mouhadev.vercel.app/join/room/SU7EHVU5
  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/join\/room\/([A-Z0-9]+)/i);
    if (match) return match[1].toUpperCase();
    // Also handle /session/{code}/... patterns
    const sessionMatch = url.pathname.match(/\/session\/([A-Z0-9]+)/i);
    if (sessionMatch) return sessionMatch[1].toUpperCase();
  } catch {
    // Not a URL — treat raw value as the code directly
  }
  return raw.trim().toUpperCase();
}

export function QRScannerModal({ visible, onClose, onScan }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const scannedRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsReady(false);
    scannedRef.current = false;
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || scannedRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Dynamically import jsqr to keep initial bundle light
      import('jsqr').then(({ default: jsQR }) => {
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (result) {
          scannedRef.current = true;
          stopCamera();
          onScan(extractCode(result.data));
        }
      });
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera, onScan]);

  useEffect(() => {
    if (!visible) {
      stopCamera();
      setError(null);
      return;
    }

    const startCamera = async () => {
      setError(null);
      setIsReady(false);
      scannedRef.current = false;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
            rafRef.current = requestAnimationFrame(scanFrame);
          };
        }
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur.");
        } else if (err?.name === 'NotFoundError') {
          setError("Aucune caméra détectée sur cet appareil.");
        } else {
          setError("Impossible d'accéder à la caméra.");
        }
      }
    };

    startCamera();
    return () => stopCamera();
  }, [visible, scanFrame, stopCamera]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4 bg-black/80">
        <div className="flex items-center gap-3">
          <QrCode size={22} color="#00D397" />
          <span className="text-white font-bold text-lg">Scanner un QR code</span>
        </div>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X size={20} color="#FFFFFF" />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="px-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle size={32} color="#EF4444" />
            </div>
            <p className="text-white text-center font-medium">{error}</p>
            <button
              onClick={() => onClose()}
              className="mt-6 px-8 py-3 bg-[#3E3666] rounded-2xl hover:bg-[#4E4676] transition-colors"
            >
              <span className="text-white font-semibold">Fermer</span>
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder overlay */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-64 h-64 relative">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#00D397] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#00D397] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#00D397] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#00D397] rounded-br-lg" />

                {/* Scan line animation */}
                {isReady && (
                  <div className="absolute left-2 right-2 h-0.5 bg-[#00D397] opacity-80 animate-scan-line" />
                )}

                {/* Loading state */}
                {!isReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera size={40} color="#FFFFFF60" />
                  </div>
                )}
              </div>

              <p className="text-white/70 text-sm mt-6 text-center px-8">
                Pointez la caméra vers le QR code de la session
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
