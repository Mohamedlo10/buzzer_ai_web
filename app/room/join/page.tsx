'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DoorOpen } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as roomsApi from '~/lib/api/rooms';

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Le code de la salle est requis');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const data = await roomsApi.joinRoom(trimmedCode);
      router.replace(`/room/${data.room.id}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setError('Aucune salle trouvée avec ce code');
      } else if (status === 409) {
        setError('Vous avez déjà rejoint cette salle');
      } else if (status === 400) {
        setError('Cette salle est pleine');
      } else {
        setError(err?.response?.data?.message || 'Erreur lors de la connexion');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#292349]">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666]">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">Rejoindre une Salle</p>
            <p className="text-white/60 text-xs mt-0.5">
              Entrez le code partagé par le propriétaire
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto">
        <div className="px-4 pt-6">
          <Card className="mb-4">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#00D39720] flex items-center justify-center">
                <DoorOpen size={28} color="#00D397" />
              </div>
            </div>

            <p className="text-white font-medium mb-2">Code de la salle</p>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="Ex: ROOM-ABC"
              className="w-full bg-[#292349] rounded-xl px-4 py-3 text-white text-center text-xl font-bold tracking-widest border border-[#3E3666] focus:border-[#00D397] focus:outline-none uppercase placeholder-white/25"
              maxLength={20}
              autoFocus
            />
          </Card>

          {error && (
            <div className="mb-4 p-4 bg-[#D5442F20] rounded-xl border border-[#D5442F40]">
              <p className="text-[#D5442F] text-center font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={isJoining}
            className={`w-full py-4 rounded-2xl flex items-center justify-center transition-colors ${
              isJoining
                ? 'bg-[#3E3666] cursor-not-allowed'
                : 'bg-[#00D397] hover:bg-[#00B377]'
            }`}
            style={
              !isJoining
                ? { boxShadow: '0 0 12px rgba(0,211,151,0.4)' }
                : undefined
            }
          >
            {isJoining ? (
              <Spinner text="Connexion..." />
            ) : (
              <span className="text-[#292349] font-bold text-lg">Rejoindre</span>
            )}
          </button>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
