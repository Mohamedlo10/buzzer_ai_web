import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, ArrowRight, Zap, Users, Trophy, QrCode } from 'lucide-react-native';
import { useRoomsData } from '~/lib/hooks/useRoomsData';
import { palette, inkAlpha } from '~/lib/theme/tokens';

export default function RoomsScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    refetch,
    recentRooms,
    rank,
    activeSessionInfo,
    showJoinModal,
    setShowJoinModal,
    showAllRooms,
    setShowAllRooms,
    code,
    setCode,
    isJoining,
    joinError,
    handleReconnectSession,
    handleJoinCode,
  } = useRoomsData({
    onNavigate: (path) => {
      router.push(path as any);
    },
  });

  const displayedRooms = showAllRooms ? recentRooms : recentRooms.slice(0, 3);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg flex-col items-center justify-center">
        <ActivityIndicator size="large" color={palette.primary} />
        <Text className="text-txt-60 text-sm mt-3 font-medium">
          Chargement des salons...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-6 flex-col items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-surface2 flex-col items-center justify-center mb-4">
          <Text className="text-3xl">😵</Text>
        </View>
        <Text className="text-buzz text-lg font-bold mb-2 text-center">
          Erreur de chargement
        </Text>
        <Text className="text-txt-60 text-sm text-center mb-6">
          Impossible de charger les salons
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          activeOpacity={0.8}
          className="px-6 py-3.5 rounded-xl bg-buzz flex-row items-center justify-center"
        >
          <Text className="text-white font-bold text-base">Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={palette.primary}
          />
        }
      >
        {/* Header Title */}
        <View className="flex-col my-3">
          <Text className="text-txt font-bold text-3xl tracking-tight mb-1">
            Hub des <Text className="text-accent">salons</Text>
          </Text>
          <Text className="text-txt-60 text-sm">
            Tes buzzers sont prêts. Prêt à tester ta stratégie ?
          </Text>
        </View>

        {/* Active Session Banner */}
        {activeSessionInfo ? (
          <View className="bg-surface rounded-2xl border border-line p-3.5 mb-4 flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-full bg-gold/25 flex-col items-center justify-center mr-3">
                <Zap size={20} color={palette.gold} />
              </View>
              <View className="flex-col flex-1">
                <Text className="text-gold text-[11px] font-bold tracking-wider uppercase">
                  Session en cours #{activeSessionInfo.code || 'ACTIVE'}
                </Text>
                <Text className="text-txt font-bold text-sm mt-0.5">
                  Une partie est toujours active !
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleReconnectSession}
              activeOpacity={0.8}
              className="px-4 py-2.5 rounded-full bg-buzz flex-row items-center justify-center"
            >
              <Text className="text-white text-xs font-bold mr-1">
                Rejoindre
              </Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick Action Cards */}
        <View className="flex-row gap-3 mb-5">
          {/* Nouveau salon Card */}
          <TouchableOpacity
            onPress={() => router.push('/room/create' as any)}
            activeOpacity={0.8}
            className="flex-1 bg-buzz rounded-2xl p-4 flex-col justify-between shadow-sm min-h-[110px]"
          >
            <View className="w-9 h-9 rounded-full bg-white/20 flex-col items-center justify-center mb-4">
              <Plus size={20} color="#FFFFFF" />
            </View>
            <Text className="text-white font-bold text-base">
              Nouveau salon
            </Text>
          </TouchableOpacity>

          {/* Rejoindre Card */}
          <TouchableOpacity
            onPress={() => setShowJoinModal(true)}
            activeOpacity={0.8}
            className="flex-1 bg-surface border border-line rounded-2xl p-4 flex-col justify-between shadow-sm min-h-[110px]"
          >
            <View className="w-9 h-9 rounded-full border border-line flex-col items-center justify-center mb-2">
              <ArrowRight size={18} color={palette.primary} />
            </View>
            <View className="flex-col">
              <Text className="text-txt font-bold text-base">
                Rejoindre
              </Text>
              <Text className="text-txt-60 text-xs mt-0.5">
                scan &amp; code
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Global Rank Banner */}
        <View className="bg-surface rounded-2xl border border-line p-4 mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-gold/15 flex-col items-center justify-center mr-3">
              <Trophy size={20} color={palette.gold} />
            </View>
            <View className="flex-col">
              <Text className="text-txt-60 text-xs font-semibold">
                Classement mondial
              </Text>
              <Text className="text-txt font-bold text-lg">
                RANG #{rank || 154}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/rankings')}
            activeOpacity={0.7}
          >
            <Text className="text-accent text-xs font-bold">
              Voir tout →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rooms List Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-col">
            <Text className="text-txt font-bold text-lg">
              Mes Salons ({recentRooms.length})
            </Text>
            <Text className="text-txt-60 text-xs">
              Rejoins et consulte les détails de tes salons
            </Text>
          </View>

          {recentRooms.length > 3 ? (
            <TouchableOpacity
              onPress={() => setShowAllRooms(!showAllRooms)}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-full bg-gold/15"
            >
              <Text className="text-accent text-xs font-bold">
                {showAllRooms ? 'Réduire ↑' : 'Voir tout →'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Rooms List Items */}
        {recentRooms.length > 0 ? (
          <View className="flex-col gap-3 mb-6">
            {displayedRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                onPress={() => router.push(`/room/${room.id}` as any)}
                activeOpacity={0.8}
                className="bg-surface rounded-2xl border border-line p-4 flex-col shadow-sm"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-full bg-accent/15 flex-col items-center justify-center mr-3">
                      <Text className="text-accent font-bold text-base">
                        {room.ownerName?.charAt(0).toUpperCase() || 'S'}
                      </Text>
                    </View>
                    <View className="flex-col flex-1">
                      <Text className="text-txt font-bold text-base" numberOfLines={1}>
                        {room.name}
                      </Text>
                      <Text className="text-txt-60 text-xs">
                        Hôte: {room.ownerName}
                      </Text>
                    </View>
                  </View>

                  <View className="px-2.5 py-1 rounded-full bg-gold/15">
                    <Text className="text-gold text-xs font-bold uppercase">
                      #{room.code}
                    </Text>
                  </View>
                </View>

                <View className="h-[1px] bg-line my-2.5" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Users size={14} color={inkAlpha.muted} />
                    <Text className="text-txt-60 text-xs font-medium ml-1.5">
                      {room.memberCount} membre{room.memberCount > 1 ? 's' : ''}
                      {room.hasActiveSession ? ' · 🔴 Partie en cours' : ''}
                    </Text>
                  </View>

                  <Text className="text-accent text-xs font-bold">
                    Consulter →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="bg-surface rounded-2xl border border-line p-6 mb-6 flex-col items-center justify-center">
            <Text className="text-txt-60 text-sm text-center mb-3">
              Aucun salon rejoint pour le moment.
            </Text>
            <TouchableOpacity
              onPress={() => setShowJoinModal(true)}
              activeOpacity={0.8}
              className="px-5 py-2.5 rounded-full bg-buzz"
            >
              <Text className="text-white text-xs font-bold">
                Rejoindre avec un code
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Join Code Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View className="flex-1 bg-black/50 flex-col items-center justify-center p-4">
          <View className="w-full max-w-sm bg-surface border border-line rounded-3xl p-5 flex-col shadow-lg">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-txt font-bold text-xl">
                Rejoindre
              </Text>
              <TouchableOpacity
                onPress={() => setShowJoinModal(false)}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-surface2 flex-col items-center justify-center"
              >
                <X size={18} color={inkAlpha.soft} />
              </TouchableOpacity>
            </View>

            {/* Subtitle instructions */}
            <View className="bg-bg rounded-xl p-3 mb-4">
              <Text className="text-txt-60 text-xs text-center leading-relaxed">
                Entre le code de la partie (6 chiffres) ou de la salle permanente pour la rejoindre.
              </Text>
            </View>

            {/* Input Code */}
            <Text className="text-txt font-semibold text-xs mb-2">
              Code secret
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Ex : ABC123"
              placeholderTextColor={inkAlpha.faint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              editable={!isJoining}
              onSubmitEditing={() => handleJoinCode(code)}
              className={`w-full bg-bg rounded-xl px-4 py-3 text-txt text-center font-bold text-xl tracking-widest border ${
                joinError ? 'border-buzz' : 'border-line'
              }`}
            />

            {/* Error Display */}
            {joinError ? (
              <View className="mt-3 p-3 rounded-xl bg-buzz/10 border border-buzz/30 flex-row items-center">
                <X size={14} color={palette.bad} />
                <Text className="text-buzz text-xs font-semibold ml-2 flex-1">
                  {joinError}
                </Text>
              </View>
            ) : null}

            {/* Join CTA */}
            <TouchableOpacity
              onPress={() => handleJoinCode(code)}
              disabled={isJoining || !code.trim()}
              activeOpacity={0.8}
              className={`w-full py-3.5 rounded-full flex-row items-center justify-center mt-5 ${
                isJoining || !code.trim()
                  ? 'bg-surface2 opacity-60'
                  : 'bg-buzz'
              }`}
            >
              {isJoining ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm ml-2">
                    Connexion...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-bold text-sm">
                  Rejoindre
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
