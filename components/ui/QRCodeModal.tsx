'use client';

import { useEffect, useState } from 'react';
import { X, QrCode, Share2 } from 'lucide-react';
import * as qrcodeApi from '~/lib/api/qrcode';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'session' | 'room';
  id: string;
  code?: string;
  title?: string;
}

export function QRCodeModal({ visible, onClose, type, id, code, title }: QRCodeModalProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && id) {
      loadQRCode();
    }
  }, [visible, id, type]);

  const loadQRCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const blob = type === 'session'
        ? await qrcodeApi.getSessionQR(id)
        : await qrcodeApi.getRoomQR(id);

      // Convert blob to base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImage(reader.result as string);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError('Erreur lors du chargement du QR code');
        setIsLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger le QR code');
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!code) return;

    const message = type === 'session'
      ? `Rejoins ma partie BuzzMaster! Code: ${code}`
      : `Rejoins ma salle BuzzMaster! Code: ${code}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Invitation BuzzMaster', text: message });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(message);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
      onClick={onClose}
    >
      <div
        className="bg-[#342D5B] w-full max-w-sm rounded-3xl border border-[#3E3666] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-row items-center justify-between px-5 py-4 border-b border-[#3E3666]">
          <div className="flex flex-row items-center">
            <div className="w-10 h-10 rounded-xl bg-[#00D39720] flex items-center justify-center mr-3">
              <QrCode size={20} color="#00D397" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">
                {type === 'session' ? 'QR Code Session' : 'QR Code Salle'}
              </p>
              {title && (
                <p className="text-white/60 text-sm">{title}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
          >
            <X size={20} color="#FFFFFF" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {isLoading ? (
            <div className="w-64 h-64 rounded-2xl bg-[#292349] flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin" />
              <p className="text-white/60 mt-4">Chargement...</p>
            </div>
          ) : error ? (
            <div className="w-64 h-64 rounded-2xl bg-[#292349] flex flex-col items-center justify-center px-6">
              <p className="text-red-400 text-center">{error}</p>
              <button
                onClick={loadQRCode}
                className="mt-4 px-6 py-3 bg-[#00D397] rounded-xl hover:bg-[#00B377] transition-colors"
              >
                <span className="text-[#292349] font-bold">Réessayer</span>
              </button>
            </div>
          ) : qrImage ? (
            <div className="animate-in zoom-in-95 fade-in duration-300">
              <div className="bg-white p-4 rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImage}
                  alt="QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
              <p className="text-white/60 text-center mt-4 text-sm">
                Scannez pour rejoindre
              </p>
            </div>
          ) : null}

          {/* Code display */}
          {code && (
            <div className="mt-6 bg-[#292349] rounded-2xl px-6 py-4 border border-[#3E3666] w-full">
              <p className="text-white/60 text-sm mb-1">Code</p>
              <p className="text-[#00D397] font-bold text-2xl tracking-wider">{code}</p>
            </div>
          )}

          {/* Share button */}
          {code && (
            <button
              onClick={handleShare}
              className="mt-4 flex flex-row items-center gap-2 px-6 py-3 bg-[#3E3666] rounded-xl hover:bg-[#4E4676] transition-colors"
            >
              <Share2 size={18} color="#FFFFFF" />
              <span className="text-white font-medium">Partager</span>
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="px-5 py-4 bg-[#292349] border-t border-[#3E3666]">
          <p className="text-white/50 text-sm text-center">
            Scannez ce QR code avec votre appareil photo pour rejoindre automatiquement
          </p>
        </div>
      </div>
    </div>
  );
}
