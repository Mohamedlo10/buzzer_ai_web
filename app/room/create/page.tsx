'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderOpen, Users } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as roomsApi from '~/lib/api/rooms';

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(250);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Le nom de la salle est requis');
      return;
    }

    if (trimmedName.length < 3) {
      setError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const room = await roomsApi.createRoom({
        name: trimmedName,
        description: description.trim() || undefined,
        maxPlayers,
      });
      router.replace(`/room/${room.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erreur lors de la création';
      setError(message);
    } finally {
      setIsCreating(false);
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
            <p className="text-white font-bold text-xl">Nouvelle Salle</p>
            <p className="text-white/60 text-xs mt-0.5">Créez un espace pour vos parties</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto">
        <div className="px-4 pt-6">
          <Card className="mb-4">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#00D39720] flex items-center justify-center">
                <FolderOpen size={28} color="#00D397" />
              </div>
            </div>

            <p className="text-white font-medium mb-2">Nom de la salle *</p>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Ex: Soirée quiz, Les Champions..."
              className="w-full bg-[#292349] rounded-xl px-4 py-3 text-white border border-[#3E3666] focus:border-[#00D397] focus:outline-none mb-4 placeholder-white/25"
              maxLength={50}
              autoFocus
            />

            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-medium">Nombre maximum de joueurs</p>
              <div className="flex items-center gap-2 bg-[#292349] rounded-xl border border-[#3E3666] px-3 py-1.5">
                <Users size={14} color="#00D397" />
                <span className="text-white font-bold text-sm w-8 text-center">{maxPlayers}</span>
              </div>
            </div>
            <input
              type="range"
              min={2}
              max={250}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full accent-[#00D397] mb-1"
            />
            <div className="flex justify-between text-white/30 text-xs mb-4">
              <span>2</span>
              <span>250</span>
            </div>

            <p className="text-white font-medium mb-2">Description (optionnel)</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre salle..."
              className="w-full bg-[#292349] rounded-xl px-4 py-3 text-white border border-[#3E3666] focus:border-[#00D397] focus:outline-none resize-none placeholder-white/25"
              maxLength={200}
              rows={3}
              style={{ minHeight: 80 }}
            />
          </Card>

          {error && (
            <div className="mb-4 p-4 bg-[#D5442F20] rounded-xl border border-[#D5442F40]">
              <p className="text-[#D5442F] text-center font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className={`w-full py-4 rounded-2xl flex items-center justify-center transition-colors ${
              isCreating
                ? 'bg-[#3E3666] cursor-not-allowed'
                : 'bg-[#00D397] hover:bg-[#00B377]'
            }`}
            style={
              !isCreating
                ? { boxShadow: '0 0 12px rgba(0,211,151,0.4)' }
                : undefined
            }
          >
            {isCreating ? (
              <Spinner text="Création..." />
            ) : (
              <span className="text-[#292349] font-bold text-lg">Créer la salle</span>
            )}
          </button>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
