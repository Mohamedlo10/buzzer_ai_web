'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FolderOpen, AlertCircle, Users } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as roomsApi from '~/lib/api/rooms';
import type { RoomInfo } from '~/types/api';

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(250);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const detail = await roomsApi.getRoomDetail(roomId);
        setRoom(detail.room);
        setName(detail.room.name);
        setDescription(detail.room.description ?? '');
        setMaxPlayers(detail.room.maxPlayers ?? 250);
      } catch {
        setError('Impossible de charger la salle');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [roomId]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Le nom de la salle est requis');
      return;
    }
    if (trimmedName.length < 3) {
      setError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await roomsApi.updateRoom(roomId, {
        name: trimmedName,
        description: description.trim() || undefined,
        maxPlayers,
      });
      router.back();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erreur lors de la modification';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement..." />
      </div>
    );
  }

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
            <p className="text-white font-bold text-xl">Modifier la salle</p>
            <p className="text-white/60 text-xs mt-0.5">{room?.name}</p>
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
            <div className="mb-4 p-4 bg-[#D5442F20] rounded-xl border border-[#D5442F40] flex items-center gap-3">
              <AlertCircle size={18} color="#D5442F" />
              <p className="text-[#D5442F] font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl flex items-center justify-center transition-colors ${
              isSaving
                ? 'bg-[#3E3666] cursor-not-allowed'
                : 'bg-[#00D397] hover:bg-[#00B377]'
            }`}
            style={!isSaving ? { boxShadow: '0 0 12px rgba(0,211,151,0.4)' } : undefined}
          >
            {isSaving ? (
              <Spinner text="Enregistrement..." />
            ) : (
              <span className="text-[#292349] font-bold text-lg">Enregistrer</span>
            )}
          </button>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
