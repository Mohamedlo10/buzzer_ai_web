import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Settings,
  Trash2,
  Play,
  UserPlus,
  LogOut,
  Sparkles,
  QrCode,
  Eye,
  Users,
} from 'lucide-react-native';
import { useRoomDetail } from '~/lib/hooks/useRoomDetail';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';

export default function RoomDetailScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  const {
    roomData,
    isLoading,
    showConfigModal,
    setShowConfigModal,
    showInviteModal,
    setShowInviteModal,
    showHistoryModal,
    setShowHistoryModal,
    user,
    room,
    isOwner,
    members,
    activeSessions,
    pastSessions,
    navigateToSession,
    handleLeaveRoom,
    handleDeleteRoom,
  } = useRoomDetail({
    roomId: roomId ?? '',
    onNavigate: (path) => router.push(path as any),
    onReplaceRoute: (path) => router.replace(path as any),
  });

  const [showQrExpanded, setShowQrExpanded] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg flex-col items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-accent/15 flex-col items-center justify-center mb-4 border border-line">
          <Sparkles size={40} color={palette.primary} />
        </View>
        <Text className="text-txt font-semibold text-base">Chargement du salon...</Text>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView className="flex-1 bg-bg flex-col items-center justify-center px-6">
        <View className="w-24 h-24 rounded-full bg-surface flex-col items-center justify-center mb-4 border border-line">
          <Eye size={48} color={inkAlpha.muted} />
        </View>
        <Text className="text-txt-60 text-base text-center mb-6">
          Salle introuvable
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="bg-buzz px-8 py-3.5 rounded-2xl flex-row items-center justify-center"
        >
          <Text className="text-white font-bold text-base">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-bg border-b border-line justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-surface border border-line flex-col items-center justify-center"
        >
          <ChevronLeft size={20} color={palette.primary} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 18,
            lineHeight: 24,
            color: palette.txt,
            paddingTop: 2,
            flex: 1,
            marginHorizontal: 12,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {room.name}
        </Text>

        <View className="flex-row items-center gap-2">
          {isOwner ? (
            <TouchableOpacity
              onPress={() => router.push(`/room/${roomId}/edit` as any)}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full bg-surface border border-line flex-col items-center justify-center"
            >
              <Settings size={20} color={inkAlpha.soft} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Room Code Card */}
        <View className="bg-surface rounded-3xl border border-line p-5 flex-col items-center mb-4 shadow-sm">
          <Text className="text-txt-40 text-xs font-bold tracking-widest uppercase mb-1">
            Code du salon
          </Text>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 32,
              lineHeight: 40,
              color: palette.primary,
              letterSpacing: 2,
              paddingTop: 4,
              marginBottom: 12,
            }}
          >
            #{room.code}
          </Text>

          <View className="flex-row items-center bg-bg px-3 py-1.5 rounded-full border border-line">
            <Users size={14} color={palette.gold} />
            <Text className="text-txt-60 text-xs font-semibold ml-1.5">
              {members.length} membre{members.length > 1 ? 's' : ''} connecté{members.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Active Session Card or Launch Session Button */}
        {activeSessions.length > 0 ? (
          <View className="mb-4">
            <Text className="text-txt-40 text-xs font-bold tracking-widest uppercase mb-2">
              Session active en cours
            </Text>
            {activeSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => navigateToSession(session)}
                activeOpacity={0.8}
                className="bg-surface border border-line rounded-2xl p-4 flex-col mb-2 shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-buzz mr-2" />
                    <Text className="text-txt font-bold text-base">
                      Session #{session.code}
                    </Text>
                  </View>
                  <Text className="text-gold text-xs font-bold uppercase">
                    {session.status}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigateToSession(session)}
                  activeOpacity={0.8}
                  className="mt-2 py-2.5 rounded-xl bg-buzz flex-row items-center justify-center"
                >
                  <Text className="text-white text-xs font-bold">
                    Rejoindre la partie →
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              // Direct navigation to session create
              router.push(`/session/create?roomId=${roomId}` as any);
            }}
            activeOpacity={0.8}
            className="w-full py-4 rounded-2xl bg-buzz flex-row items-center justify-center shadow-md mb-4"
          >
            <Play size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-base ml-2">
              🚀 CRÉER &amp; LANCER UNE SESSION
            </Text>
          </TouchableOpacity>
        )}

        {/* Members List */}
        <View className="bg-surface rounded-3xl border border-line p-4 mb-4 flex-col">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-txt font-bold text-base">
              Membres ({members.length})
            </Text>
          </View>

          {members.map((member) => (
            <View
              key={member.userId}
              className="flex-row items-center justify-between py-2.5 border-b border-line/40"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-accent/15 flex-col items-center justify-center mr-3">
                  <Text className="text-accent font-bold text-sm">
                    {member.username?.charAt(0).toUpperCase() || 'M'}
                  </Text>
                </View>
                <View className="flex-col">
                  <Text className="text-txt font-semibold text-sm">
                    {member.username}
                  </Text>
                  {member.userId === room.ownerId ? (
                    <Text className="text-gold text-[10px] font-bold">
                      HÔTE
                    </Text>
                  ) : null}
                </View>
              </View>

              <View
                className={`w-2.5 h-2.5 rounded-full ${
                  member.isOnline ? 'bg-good' : 'bg-line'
                }`}
              />
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <View className="bg-surface rounded-2xl border border-line overflow-hidden mb-4 flex-col">
          {!isOwner ? (
            <TouchableOpacity
              onPress={handleLeaveRoom}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-3.5"
            >
              <LogOut size={18} color={palette.bad} />
              <Text className="text-buzz font-medium text-sm ml-3">
                Quitter la salle
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleDeleteRoom}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-3.5"
            >
              <Trash2 size={18} color={palette.bad} />
              <Text className="text-buzz font-medium text-sm ml-3">
                Supprimer la salle
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
