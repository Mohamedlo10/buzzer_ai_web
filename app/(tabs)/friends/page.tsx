'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, UserPlus, Users, X } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
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

  const {
    friends,
    pendingRequests,
    isLoading,
    fetchFriends,
    fetchPendingRequests,
    acceptRequest,
    declineRequest,
    removeFriend,
    sendRequest,
  } = useFriendStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchFriends(), fetchPendingRequests()]);
  }, [fetchFriends, fetchPendingRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await usersApi.searchUsers(searchQuery);
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

  const handleRemove = (friendId: string, friendName: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer ${friendName} de votre liste d'amis ?`)) {
      removeFriend(friendId).catch(() => {
        alert("Impossible de supprimer l'ami");
      });
    }
  };

  const incomingRequests = pendingRequests;

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
          <FriendCard
            key={friend.id}
            friend={friend}
            onInvite={() => {/* TODO: Invite to session */}}
            onRemove={() => handleRemove(friend.id, friend.username)}
          />
        ))
      )}
    </>
  );

  const renderRequestsList = () => (
    <>
      {incomingRequests.length > 0 ? (
        <div>
          <p className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">
            Demandes reçues ({incomingRequests.length})
          </p>
          {incomingRequests.map((request) => (
            <FriendRequestCard
              key={request.id}
              request={request}
              onAccept={() => handleAccept(request.id)}
              onDecline={() => handleDecline(request.id)}
            />
          ))}
        </div>
      ) : (
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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 hover:opacity-70 transition-opacity cursor-pointer"
            >
              <X size={18} color="#FFFFFF60" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className={`mt-3 py-3 rounded-xl w-full flex items-center justify-center transition-opacity cursor-pointer ${
            isSearching || !searchQuery.trim()
              ? 'bg-[#3E3666] cursor-not-allowed'
              : 'bg-[#00D397] hover:opacity-90'
          }`}
        >
          {isSearching ? (
            <Spinner text="Recherche..." />
          ) : (
            <span className={`font-bold ${searchQuery.trim() ? 'text-[#292349]' : 'text-white/40'}`}>
              Rechercher
            </span>
          )}
        </button>
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
            const isSent = sentRequests.has(user.id);

            return (
              <Card key={user.id} className="mb-3">
                <div className="flex flex-row items-center">
                  <div className="w-12 h-12 rounded-full bg-[#3E3666] flex items-center justify-center mr-3 shrink-0">
                    <Users size={24} color="#FFFFFF" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{user.username}</p>
                    <p className="text-white/50 text-sm">
                      {isFriend ? 'Déjà ami' : hasPendingRequest ? 'Demande en cours' : ''}
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
      <div className="px-4 pt-20 pb-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <p className="text-white font-bold text-2xl">Amis</p>
          {activeTab !== 'friends' && (
            <button
              onClick={() => setActiveTab('friends')}
              className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="text-white text-sm">←</span>
            </button>
          )}
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
                  `Demandes${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`}
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
