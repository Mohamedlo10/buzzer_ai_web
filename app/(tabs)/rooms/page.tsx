'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  ChevronDown,
  FolderOpen,
  Users,
  Crown,
  Gamepad2,
  ChevronRight as ChevronRightIcon,
  UserCheck,
  Clock,
  UserX,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { useAuthStore } from '~/stores/useAuthStore';
import * as roomsApi from '~/lib/api/rooms';
import type { RoomSummaryResponse } from '~/types/api';

const ITEMS_PER_PAGE = 8;

function RoomCard({ room }: { room: RoomSummaryResponse }) {
  const router = useRouter();
  const userId = useAuthStore.getState().user?.id;
  const isOwner = room.ownerId === userId;

  const getFriendshipIcon = () => {
    if (isOwner) return null;
    switch (room.ownerFriendshipStatus) {
      case 'ACCEPTED':
        return <UserCheck size={12} color="#00D397" />;
      case 'PENDING':
        return <Clock size={12} color="#F39C12" />;
      case 'DECLINED':
      case 'BLOCKED':
        return <UserX size={12} color="#FFFFFF40" />;
      default:
        return null;
    }
  };

  const friendshipIcon = getFriendshipIcon();

  return (
    <button
      onClick={() => router.push(`/room/${room.id}`)}
      className="mb-3 w-full text-left hover:opacity-80 active:opacity-70 transition-opacity cursor-pointer"
    >
      <Card>
        <div className="flex flex-row items-center">
          <div className="w-12 h-12 rounded-xl bg-[#3E3666] flex items-center justify-center mr-3 shrink-0">
            <FolderOpen size={24} color="#FFFFFF" />
          </div>
          <div className="flex-1">
            <div className="flex flex-row items-center">
              <span className="text-white font-semibold text-lg">{room.name}</span>
              {isOwner && <Crown size={14} color="#FFD700" className="ml-2" />}
            </div>
            <div className="flex flex-row items-center mt-0.5">
              <span className="text-white/50 text-sm">Code: {room.code}</span>
              {room.hasActiveSession && (
                <div className="flex flex-row items-center ml-3 bg-[#00D39720] px-2 py-0.5 rounded-full">
                  <Gamepad2 size={10} color="#00D397" />
                  <span className="text-[#00D397] text-[10px] font-medium ml-1">En cours</span>
                </div>
              )}
            </div>
            <div className="flex flex-row items-center mt-1">
              <span className="text-white/40 text-xs">par {room.ownerName}</span>
              {friendshipIcon && <span className="ml-1.5">{friendshipIcon}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex flex-row items-center bg-[#3E366680] px-2 py-1 rounded-full">
              <Users size={12} color="#FFFFFF80" className="mr-1" />
              <span className="text-white/60 text-xs font-medium">{room.memberCount}</span>
            </div>
            <ChevronRightIcon size={20} color="#FFFFFF40" className="mt-1" />
          </div>
        </div>
      </Card>
    </button>
  );
}

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummaryResponse[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [joinError, setJoinError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    try {
      const data = await roomsApi.getUserRooms();
      setRooms(data);
      setFilteredRooms(data);
      setVisibleCount(ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleSearch = (code: string) => {
    setSearchCode(code);
    setVisibleCount(ITEMS_PER_PAGE);
    setJoinError(null);

    if (!code.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const filtered = rooms.filter((room) =>
      room.code.toLowerCase().includes(code.toLowerCase()),
    );
    setFilteredRooms(filtered);
  };

  const handleJoinByCode = async () => {
    const trimmedCode = searchCode.trim().toUpperCase();
    if (!trimmedCode) return;

    setJoinError(null);
    try {
      const data = await roomsApi.joinRoom(trimmedCode);
      setSearchCode('');
      router.push(`/room/${data.room.id}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setJoinError('Aucune salle trouvée avec ce code');
      } else if (status === 409) {
        setJoinError('Vous avez déjà rejoint cette salle');
      } else if (status === 400) {
        setJoinError('Cette salle a atteint le nombre maximum de membres');
      } else {
        setJoinError(err?.response?.data?.message || 'Impossible de rejoindre la salle');
      }
    }
  };

  const handleCreateRoom = () => {
    router.push('/room/create');
  };

  const visibleRooms = filteredRooms.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRooms.length;

  if (isLoading) {
    return (
      <SafeScreen className="bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="px-4 pt-4 pb-4">
        <p className="text-white font-bold text-2xl">Mes Salles</p>
        <p className="text-white/60 text-sm">Rejoignez ou créez une salle de jeu</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search by Code */}
        <div className="px-4 mb-4">
          <div className="flex flex-row items-center bg-[#342D5B] rounded-xl border border-[#3E3666] px-4">
            <Search size={20} color="#FFFFFF60" className="shrink-0" />
            <input
              value={searchCode}
              onChange={(e) => handleSearch(e.target.value.toUpperCase())}
              placeholder="Rechercher par code..."
              className="flex-1 py-3 px-3 bg-transparent text-white focus:outline-none placeholder-white/40"
              autoCapitalize="characters"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
            />
            {searchCode.length > 0 && (
              <button
                onClick={handleJoinByCode}
                className="bg-[#00D397] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span className="text-[#292349] font-bold text-xs">Rejoindre</span>
              </button>
            )}
          </div>
          {joinError && (
            <p className="text-[#D5442F] text-xs mt-2 px-1">{joinError}</p>
          )}
        </div>

        {/* My Rooms */}
        <div className="px-4">
          <div className="flex flex-row items-center justify-between mb-3">
            <p className="text-white font-bold text-lg">
              Salles ({filteredRooms.length})
            </p>
            <button
              onClick={handleCreateRoom}
              className="flex flex-row items-center bg-[#00D39720] px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus size={14} color="#00D397" />
              <span className="text-[#00D397] text-xs font-medium ml-1">Créer</span>
            </button>
          </div>

          {filteredRooms.length === 0 ? (
            <Card className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#3E3666] flex items-center justify-center mb-3">
                <FolderOpen size={28} color="#FFFFFF" />
              </div>
              <p className="text-white font-semibold mb-1">
                {searchCode ? 'Aucune salle trouvée' : 'Aucune salle'}
              </p>
              <p className="text-white/50 text-center text-sm mb-4 px-6">
                {searchCode
                  ? 'Essayez un autre code ou créez une nouvelle salle'
                  : 'Créez une salle ou rejoignez-en une avec un code'}
              </p>
              <button
                onClick={handleCreateRoom}
                className="bg-[#00D397] px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span className="text-[#292349] font-bold">Créer une salle</span>
              </button>
            </Card>
          ) : (
            <>
              {visibleRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}

              {hasMore && (
                <button
                  onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  className="w-full mb-3 py-3 rounded-xl bg-[#342D5B] border border-[#3E3666] hover:bg-[#3E3666] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronDown size={18} color="#FFFFFF80" />
                  <span className="text-white/70 text-sm font-medium">
                    Charger plus ({filteredRooms.length - visibleCount} restantes)
                  </span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="h-8" />
      </div>
    </SafeScreen>
  );
}
