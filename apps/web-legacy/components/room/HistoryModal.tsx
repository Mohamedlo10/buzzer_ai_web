import { X, History, Trophy, ChevronRight } from 'lucide-react';
import type { RoomSessionResponse } from '~/types/api';

export function HistoryModal({
  sessions,
  onNavigate,
  onClose,
}: {
  sessions: RoomSessionResponse[];
  onNavigate: (session: RoomSessionResponse) => void;
  onClose: () => void;
}) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return `Aujourd'hui • ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (diff === 1) return `Hier • ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-bg pb-20 rounded-t-3xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-line shrink-0">
          <div>
            <p className="text-txt font-bold text-xl">Historique des parties</p>
            <p className="text-txt-60 text-xs mt-0.5">{sessions.length} partie{sessions.length !== 1 ? 's' : ''} jouée{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
            <X size={20} color="#FFFFFF" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <History size={40} color="#FFFFFF20" />
              <p className="text-txt-40 text-center mt-3">Aucune partie terminée</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => { onNavigate(session); onClose(); }}
                className="flex items-center px-4 py-4 border-b border-line last:border-b-0 hover:bg-white/5 w-full text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C0C0C020] flex items-center justify-center mr-3 shrink-0">
                  <Trophy size={18} color="#C0C0C0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-txt font-semibold">Partie #{session.code}</p>
                  <p className="text-txt-40 text-xs mt-0.5">
                    {formatDate(session.createdAt)} • {session.playerCount} joueurs
                  </p>
                </div>
                <ChevronRight size={18} color="#FFFFFF30" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
