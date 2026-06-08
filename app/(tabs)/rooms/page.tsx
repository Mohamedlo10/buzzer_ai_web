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
        return <UserCheck size={12} className="text-accent" />;
      case 'PENDING':
        return <Clock size={12} className="text-warn" />;
      case 'DECLINED':
      case 'BLOCKED':
        return <UserX size={12} className="text-txt-40" />;
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
          <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mr-3 shrink-0">
            <FolderOpen size={24} className="text-txt" />
          </div>
          <div className="flex-1">
            <div className="flex flex-row items-center">
              <span className="text-txt font-semibold text-lg">{room.name}</span>
              {isOwner && <Crown size={14} className="text-energy ml-2" />}
            </div>
            <div className="flex flex-row items-center mt-0.5">
              <span className="text-txt-60 text-sm">Code: {room.code}</span>
              {room.hasActiveSession && (
                <div className="flex flex-row items-center ml-3 bg-accent/15 px-2 py-0.5 rounded-full">
                  <Gamepad2 size={10} className="text-accent" />
                  <span className="text-accent text-[10px] font-medium ml-1">En cours</span>
                </div>
              )}
            </div>
            <div className="flex flex-row items-center mt-1">
              <span className="text-txt-40 text-xs">par {room.ownerName}</span>
              {friendshipIcon && <span className="ml-1.5">{friendshipIcon}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex flex-row items-center bg-surface-2 px-2 py-1 rounded-full">
              <Users size={12} className="text-txt-60 mr-1" />
              <span className="text-txt-60 text-xs font-medium">{room.memberCount}</span>
            </div>
            <ChevronRightIcon size={20} className="text-txt-40 mt-1" />
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

  const handleSearch = (query: string) => {
    setSearchCode(query);
    setVisibleCount(ITEMS_PER_PAGE);
    setJoinError(null);

    if (!query.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const lower = query.toLowerCase();
    const filtered = rooms.filter(
      (room) =>
        room.code.toLowerCase().includes(lower) ||
        room.name.toLowerCase().includes(lower),
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
      <SafeScreen className="flex items-center justify-center">
        <Spinner text="Chargement..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      {/* Header */}
      <div className="px-4 pt-4 pb-4">
        <p className="text-txt font-bold text-2xl font-display">Mes Salles</p>
        <p className="text-txt-60 text-sm">Rejoignez ou créez une salle de jeu</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search by Code */}
        <div className="px-4 mb-4">
          <div className="flex flex-row items-center bg-surface rounded-xl border border-line px-4">
            <Search size={20} className="text-txt-60 shrink-0" />
            <input
              value={searchCode}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher par nom ou code..."
              className="flex-1 py-3 px-3 bg-transparent text-txt focus:outline-none placeholder:text-txt-40"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
            />
            {searchCode.length > 0 && (
              <button
                onClick={handleJoinByCode}
                className="bg-accent px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span className="text-btn-fg font-bold text-xs">Rejoindre</span>
              </button>
            )}
          </div>
          {joinError && (
            <p className="text-buzz text-xs mt-2 px-1">{joinError}</p>
          )}
        </div>

        {/* My Rooms */}
        <div className="px-4">
          <div className="flex flex-row items-center justify-between mb-3">
            <p className="text-txt font-bold text-lg">
              Salles ({filteredRooms.length})
            </p>
            <button
              onClick={handleCreateRoom}
              className="flex flex-row items-center bg-accent/15 px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus size={14} className="text-accent" />
              <span className="text-accent text-xs font-medium ml-1">Créer</span>
            </button>
          </div>

          {filteredRooms.length === 0 ? (
            <Card className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                <FolderOpen size={28} className="text-txt" />
              </div>
              <p className="text-txt font-semibold mb-1">
                {searchCode ? 'Aucune salle trouvée' : 'Aucune salle'}
              </p>
              <p className="text-txt-60 text-center text-sm mb-4 px-6">
                {searchCode
                  ? 'Essayez un autre nom ou code, ou créez une nouvelle salle'
                  : 'Créez une salle ou rejoignez-en une avec un code'}
              </p>
              <button
                onClick={handleCreateRoom}
                className="bg-accent px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span className="text-btn-fg font-bold">Créer une salle</span>
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
                  className="w-full mb-3 py-3 rounded-xl bg-surface border border-line hover:bg-surface-2 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronDown size={18} className="text-txt-60" />
                  <span className="text-txt-60 text-sm font-medium">
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
