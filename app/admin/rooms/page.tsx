'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, FolderOpen, Users, ChevronRight } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as adminApi from '~/lib/api/admin';
import type { AdminRoomSummaryResponse } from '~/types/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

export default function AdminRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<AdminRoomSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadRooms = useCallback(async (pageNum = 0, append = false, searchVal = search) => {
    try {
      const params: Record<string, unknown> = { page: pageNum, size: 20 };
      if (searchVal.trim()) params.search = searchVal.trim();
      const response = await adminApi.getAdminRooms(params);
      if (append) {
        setRooms((prev) => [...prev, ...response.content]);
      } else {
        setRooms(response.content);
      }
      setHasMore(!response.last);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(0);
    setIsLoading(true);
    loadRooms(0, false, val);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    await loadRooms(0, false, search);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadRooms(nextPage, true);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      handleLoadMore();
    }
  };

  return (
    <div className="min-h-screen bg-[#292349] flex flex-col">
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
            <p className="text-white font-bold text-xl">Salles</p>
            <p className="text-white/60 text-xs">{rooms.length} salle{rooms.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-[#00D397] text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center bg-[#342D5B] rounded-xl border border-[#3E3666] px-4">
          <Search size={18} color="#FFFFFF60" className="shrink-0" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher par nom ou code..."
            className="flex-1 py-3 px-3 bg-transparent text-white focus:outline-none placeholder-white/40 text-sm"
          />
        </div>
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto px-4" onScroll={handleScroll}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner text="Chargement..." />
          </div>
        ) : rooms.length === 0 ? (
          <Card className="flex items-center justify-center py-12">
            <p className="text-white/50">Aucune salle trouvée</p>
          </Card>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => router.push(`/admin/rooms/${room.id}`)}
              className="w-full text-left mb-3"
            >
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center shrink-0">
                    <FolderOpen size={20} color="#FFFFFF" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold truncate">{room.name}</span>
                      {!room.isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#D5442F20] text-[#D5442F] shrink-0">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-white/40 text-xs">Code: {room.code}</span>
                      <span className="text-white/40 text-xs">par {room.ownerUsername}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Users size={11} color="#FFFFFF60" />
                        <span className="text-white/50 text-xs">{room.memberCount} membre{room.memberCount !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-white/40 text-xs">{room.sessionCount} session{room.sessionCount !== 1 ? 's' : ''}</span>
                      <span className="text-white/30 text-xs">Créée {formatDate(room.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#FFFFFF40" className="shrink-0" />
                </div>
              </Card>
            </button>
          ))
        )}

        {hasMore && !isLoading && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 text-[#00D397] text-sm font-medium hover:opacity-80 transition-opacity mb-4"
          >
            Charger plus
          </button>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
