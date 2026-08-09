import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Play, DoorOpen, Users, Crown, Gamepad2, Share2, Copy } from 'lucide-react-native';
import { useLobbySession } from '~/lib/hooks/useLobbySession';
import { useAppStateReconnect } from '~/lib/websocket/useAppStateReconnect';
import { palette, inkAlpha } from '~/lib/theme/tokens';

export default function LobbyScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  // Automatic WS reconnect when coming back to foreground
  useAppStateReconnect();

  const {
    session,
    players,
    user,
    isManager,
    isStarting,
    isConnected,
    handleStartGame,
    handleLeave,
  } = useLobbySession({
    code: code || '',
    onNavigate: (path) => router.push(path as any),
    onReplaceRoute: (path) => router.replace(path as any),
  });

  const [copied, setCopied] = useState(false);

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-bg flex-col items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-accent/15 flex-col items-center justify-center mb-4 border border-line">
          <Gamepad2 size={32} color={palette.primary} />
        </View>
        <Text className="text-txt font-bold text-base tracking-widest">
          CHARGEMENT DU LOBBY...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-bg border-b border-line justify-between">
        <TouchableOpacity
          onPress={() => {
            if (session.roomId) {
              router.replace(`/room/${session.roomId}` as any);
            } else {
              router.replace('/(tabs)/rooms');
            }
          }}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-surface border border-line flex-col items-center justify-center"
        >
          <ChevronLeft size={20} color={palette.primary} />
        </TouchableOpacity>

        <View className="flex-col items-center">
          <Text className="text-txt font-bold text-lg">
            Lobby #{code}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View className={`w-2 h-2 rounded-full ${isConnected ? 'bg-good' : 'bg-bad'} mr-1.5`} />
            <Text className="text-txt-60 text-xs font-semibold">
              {isConnected ? 'Connecté' : 'Connexion...'}
            </Text>
          </View>
        </View>

        <View className="w-10 h-10" />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Session Info Hero Card */}
        <View className="bg-surface rounded-3xl border border-line p-5 flex-col items-center mb-5 shadow-sm">
          <Text className="text-txt-40 text-xs font-bold tracking-widest uppercase mb-1">
            Code de la partie
          </Text>
          <Text className="text-accent text-3xl font-bold tracking-widest mb-3 select-all">
            {code}
          </Text>

          <View className="flex-row items-center gap-3">
            <View className="bg-bg px-3.5 py-1.5 rounded-full border border-line flex-row items-center">
              <Users size={14} color={palette.gold} />
              <Text className="text-txt-60 text-xs font-semibold ml-1.5">
                {players.length} / {session.maxPlayers || 10} Joueurs
              </Text>
            </View>
          </View>
        </View>

        {/* Manager Start CTA */}
        {isManager ? (
          <TouchableOpacity
            onPress={handleStartGame}
            disabled={isStarting}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-md mb-6 ${
              isStarting ? 'bg-surface2 opacity-70' : 'bg-buzz'
            }`}
          >
            {isStarting ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-bold text-base ml-2">
                  Lancement...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Play size={20} color="#FFFFFF" />
                <Text className="text-white font-bold text-base ml-2">
                  🚀 LANCER LA PARTIE
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View className="bg-surface rounded-2xl border border-line p-4 mb-6 flex-col items-center">
            <Text className="text-txt-60 text-xs font-semibold text-center mb-1">
              Attente de l&apos;hôte...
            </Text>
            <Text className="text-txt text-sm font-bold text-center">
              L&apos;hôte démarrera la partie quand tout le monde sera prêt
            </Text>
          </View>
        )}

        {/* Players Grid / List */}
        <View className="bg-surface rounded-3xl border border-line p-4 mb-6 flex-col">
          <Text className="text-txt font-bold text-base mb-3">
            Joueurs dans le lobby ({players.length})
          </Text>

          {players.map((player) => {
            const isPlayerHost = player.userId === session.managerId;
            const isMe = player.userId === user?.id;

            return (
              <View
                key={player.id || player.userId}
                className="flex-row items-center justify-between py-3 border-b border-line/40"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-full bg-accent/15 flex-col items-center justify-center mr-3">
                    <Text className="text-accent font-bold text-base">
                      {player.name?.charAt(0).toUpperCase() || 'P'}
                    </Text>
                  </View>
                  <View className="flex-col flex-1">
                    <Text className="text-txt font-bold text-sm" numberOfLines={1}>
                      {player.name} {isMe ? '(Moi)' : ''}
                    </Text>
                    {isPlayerHost ? (
                      <View className="flex-row items-center mt-0.5">
                        <Crown size={12} color={palette.gold} />
                        <Text className="text-gold text-[10px] font-bold ml-1">
                          HÔTE
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View className="px-3 py-1 rounded-full bg-good/15">
                  <Text className="text-good text-xs font-bold">
                    PRÊT
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Non-manager Quit Button */}
        {!isManager ? (
          <TouchableOpacity
            onPress={handleLeave}
            activeOpacity={0.8}
            className="w-full py-3.5 rounded-2xl bg-buzz/10 border border-buzz/30 flex-row items-center justify-center mb-4"
          >
            <DoorOpen size={18} color={palette.bad} />
            <Text className="text-buzz font-bold text-sm ml-2">
              Quitter la session
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
