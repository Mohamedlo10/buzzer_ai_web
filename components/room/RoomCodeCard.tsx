import { QrCode, Hash, Copy, UserPlus } from 'lucide-react';

export function RoomCodeCard({
  code,
  qrImage,
  qrLoading,
  onCopy,
  onShare,
}: {
  code: string;
  qrImage: string | null;
  qrLoading: boolean;
  onCopy: () => void;
  onShare: () => void;
}) {
  return (
    <div className="px-4 pt-4">
      <div className="bg-surface rounded-3xl border border-line p-6 flex flex-col items-center">
        {/* QR Code */}
        <div className="mb-5">
          {qrLoading ? (
            <div className="w-52 h-52 rounded-2xl bg-bg flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-txt-40 text-xs mt-3">Chargement...</p>
            </div>
          ) : qrImage ? (
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImage} alt="QR Code" className="w-52 h-52 object-contain" />
            </div>
          ) : (
            <div className="w-52 h-52 rounded-2xl bg-bg flex flex-col items-center justify-center border border-dashed border-line">
              <QrCode size={40} color="#FFFFFF20" />
              <p className="text-txt-40 text-xs mt-2">Indisponible</p>
            </div>
          )}
        </div>

        {/* Code below QR */}
        <div className="flex items-center gap-2 mb-1">
          <Hash size={14} color="var(--primary)" />
          <span className="text-txt-60 text-xs font-medium uppercase tracking-wider">
            Code de la salle
          </span>
        </div>
        <p className="text-txt text-4xl font-bold text-center tracking-[6px] mb-1 select-all">
          {code}
        </p>
        <p className="text-txt-40 text-xs mb-5">Scannez ou partagez le code</p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCopy}
            className="flex-1 flex items-center justify-center bg-accent/15 px-4 py-3 rounded-2xl hover:bg-accent/20 transition-colors"
          >
            <Copy size={17} color="var(--primary)" />
            <span className="text-accent font-semibold ml-2">Copier</span>
          </button>
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center bg-surface-2 px-4 py-3 rounded-2xl hover:bg-surface-2 transition-colors"
          >
            <UserPlus size={17} color="#FFFFFF" />
            <span className="text-txt font-semibold ml-2">Partager</span>
          </button>
        </div>
      </div>
    </div>
  );
}
