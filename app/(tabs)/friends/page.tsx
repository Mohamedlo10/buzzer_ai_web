'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, UserPlus, Users, X } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { Avatar } from '~/components/ui/Avatar';
import { FriendCard } from '~/components/friend/FriendCard';
import { FriendRequestCard } from '~/components/friend/FriendRequestCard';
import { useFriendStore } from '~/stores/useFriendStore';
import * as usersApi from '~/lib/api/users';
import type { UserResponse } from '~/types/api';

type TabType = 'friends' | 'requests' | 'search';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    friends,
    pendingRequests,
    sentRequests: storeSentRequests,
    isLoading,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    acceptRequest,
    declineRequest,
    cancelRequest,
    sendRequest,
  } = useFriendStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchFriends(), fetchPendingRequests(), fetchSentRequests()]);
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced search — fires 1s after last keystroke
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await usersApi.searchUsers(query);
      setSearchResults(results.content);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest(userId);
      setSentRequests((prev) => new Set(prev).add(userId));
    } catch (err: any) {
      alert(err?.message || "Impossible d'envoyer la demande");
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
    } catch {
      alert("Impossible d'accepter la demande");
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest(requestId);
    } catch {
      alert('Impossible de refuser la demande');
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await cancelRequest(requestId);
    } catch {
      alert("Impossible d'annuler la demande");
    }
  };

  const totalRequests = pendingRequests.length + storeSentRequests.length;

  const renderFriendsList = () => (
    <>
      {friends.length === 0 ? (
        <Card className="flex flex-col items-center py-12">
          <Users size={48} color="#FFFFFF40" className="mb-4" />
          <p className="text-white/60 text-center mb-2">Aucun ami</p>
          <p className="text-white/40 text-center text-sm px-8 mb-4">
            Ajoutez des amis pour jouer ensemble et suivre leurs activités
          </p>
          <button
            onClick={() => setActiveTab('search')}
            className="bg-[#00D397] px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="text-[#292349] font-bold">Rechercher des amis</span>
          </button>
        </Card>
      ) : (
        friends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} />
        ))
      )}
    </>
  );

  const renderRequestsList = () => (
    <>
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <p className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">
            Demandes reçues ({pendingRequests.length})
          </p>
          {pendingRequests.map((request) => (
            <FriendRequestCard
              key={request.id}
              type="received"
              request={request}
              onAccept={() => handleAccept(request.id)}
              onDecline={() => handleDecline(request.id)}
            />
          ))}
        </div>
      )}

      {storeSentRequests.length > 0 && (
        <div>
          <p className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">
            Demandes envoyées ({storeSentRequests.length})
          </p>
          {storeSentRequests.map((request) => (
            <FriendRequestCard
              key={request.id}
              type="sent"
              request={request}
              onCancel={() => handleCancel(request.id)}
            />
          ))}
        </div>
      )}

      {pendingRequests.length === 0 && storeSentRequests.length === 0 && (
        <Card className="flex flex-col items-center py-12">
          <UserPlus size={48} color="#FFFFFF40" className="mb-4" />
          <p className="text-white/60 text-center">Aucune demande en attente</p>
        </Card>
      )}
    </>
  );

  const renderSearch = () => (
    <>
      <Card className="mb-4">
        <div className="flex flex-row items-center">
          <Search size={20} color="#FFFFFF60" className="mr-3 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="flex-1 bg-transparent text-white py-3 focus:outline-none placeholder-white/40"
          />
          {isSearching && (
            <div className="w-4 h-4 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin mr-2" />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 hover:opacity-70 transition-opacity cursor-pointer"
            >
              <X size={18} color="#FFFFFF60" />
            </button>
          )}
        </div>
      </Card>

      {searchResults.length > 0 && (
        <div>
          <p className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">
            Résultats ({searchResults.length})
          </p>
          {searchResults.map((user) => {
            const isFriend = friends.some((f) => f.id === user.id);
            const hasPendingRequest = pendingRequests.some(
              (r) => r.requester.id === user.id,
            );
            const isSent = sentRequests.has(user.id) || storeSentRequests.some((r) => r.receiver.id === user.id);

            return (
              <Card key={user.id} className="mb-3">
                <div className="flex flex-row items-center">
                  <div className="mr-3 shrink-0">
                    <Avatar avatarUrl={user.avatarUrl} username={user.username} size={48} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{user.username}</p>
                    <p className="text-white/50 text-sm">
                      {isFriend ? 'Déjà ami' : hasPendingRequest ? 'Demande reçue' : isSent ? 'Demande envoyée' : ''}
                    </p>
                  </div>
                  {isFriend ? (
                    <div className="px-3 py-1.5 rounded-lg bg-[#00D39720]">
                      <span className="text-[#00D397] text-sm">Ami</span>
                    </div>
                  ) : isSent || hasPendingRequest ? (
                    <div className="px-3 py-1.5 rounded-lg bg-[#3E3666]">
                      <span className="text-white/60 text-sm">En attente</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="px-4 py-2 rounded-lg bg-[#00D397] hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <span className="text-[#292349] font-medium">Ajouter</span>
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {searchResults.length === 0 && searchQuery.length > 0 && !isSearching && (
        <Card className="flex flex-col items-center py-8">
          <p className="text-white/50 text-center">
            Aucun utilisateur trouvé pour &ldquo;{searchQuery}&rdquo;
          </p>
        </Card>
      )}
    </>
  );

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <p className="text-white font-bold text-2xl">Amis</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-row bg-[#342D5B] rounded-xl p-1">
          {(['friends', 'requests', 'search'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                activeTab === tab ? 'bg-[#00D397]' : 'hover:bg-white/5'
              }`}
            >
              <span
                className={`font-medium text-sm ${
                  activeTab === tab ? 'text-[#292349]' : 'text-white/60'
                }`}
              >
                {tab === 'friends' && 'Amis'}
                {tab === 'requests' &&
                  `Demandes${totalRequests > 0 ? ` (${totalRequests})` : ''}`}
                {tab === 'search' && 'Recherche'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <Spinner text="Chargement..." className="py-12" />
        ) : (
          <>
            {activeTab === 'friends' && renderFriendsList()}
            {activeTab === 'requests' && renderRequestsList()}
            {activeTab === 'search' && renderSearch()}
          </>
        )}
        <div className="h-8" />
      </div>
    </SafeScreen>
  );
}
