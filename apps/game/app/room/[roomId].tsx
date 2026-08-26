import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Settings,
  Trash2,
  Play,
  UserPlus,
  LogOut,
  Sparkles,
  History,
  Eye,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { useRoomDetail } from '~/lib/hooks/useRoomDetail';
import * as qrcodeApi from '~/lib/api/qrcode';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';
import { notify } from '~/lib/ui/notify';

// Dedicated Room Components
import { RoomCodeCard } from '~/components/room/RoomCodeCard';
import { ActiveSessionCard } from '~/components/room/ActiveSessionCard';
import { MembersWithStats } from '~/components/room/MembersWithStats';
import { HistoryModal } from '~/components/room/HistoryModal';
import { InviteFriendsModal } from '~/components/room/InviteFriendsModal';
import { SessionConfigForm } from '~/components/session/SessionConfigForm';

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
    showQrExpanded,
    setShowQrExpanded,
    user,
    room,
    isOwner,
    members,
    rankings,
    activeSessions,
    pastSessions,
    navigateToSession,
    handleSessionCreated,
    handleSendFriendRequest,
    handleLeaveRoom,
    handleDeleteSession,
    handleDeleteRoom,
  } = useRoomDetail({
    roomId: (roomId as string) ?? '',
    onNavigate: (path) => router.push(path as any),
    onReplaceRoute: (path) => {
      if (path === '/rooms' || path === '/(tabs)/rooms' || path === '/(tabs)/solo' || path === '/(tabs)/dashboard') {
        router.replace('/(tabs)/rooms' as any);
      } else {
        router.replace(path as any);
      }
    },
  });

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const loadQR = useCallback(async (rId: string) => {
    setQrLoading(true);
    try {
      const blob = await qrcodeApi.getRoomQR(rId);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImage(reader.result as string);
        setQrLoading(false);
      };
      reader.onerror = () => setQrLoading(false);
      reader.readAsDataURL(blob);
    } catch {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (room?.id) loadQR(room.id);
  }, [room?.id, loadQR]);

  const handleCopyCode = async () => {
    if (!room?.code) return;
    try {
      await Clipboard.setStringAsync(room.code);
      setIsCopied(true);
      notify.success('Code copié !');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!room?.code) return;
    const msg = `Rejoins mon salon « ${room.name} » sur Xalaat ! Code : ${room.code}`;
    try {
      await Share.share({
        message: msg,
        title: `Salon ${room.name} — Xalaat`,
      });
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: `${palette.primary}18`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: `${palette.primary}33`,
          }}
        >
          <Sparkles size={32} color={palette.primary} />
        </View>
        <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt }}>
          Chargement du salon...
        </Text>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Eye size={32} color={palette.inkSoft} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt, marginBottom: 16 }}>
          Salon introuvable
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/rooms' as any)}
          activeOpacity={0.8}
          style={{
            backgroundColor: palette.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 14 }}>
            Retour aux salons
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Top Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/rooms' as any)}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 17,
              lineHeight: 24,
              color: palette.txt,
              paddingTop: 2,
            }}
            numberOfLines={1}
          >
            {room.name}
          </Text>
          <Text style={{ fontSize: 11.5, color: palette.inkSoft }}>
            {members.length} membre{members.length > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={() => setShowHistoryModal(true)}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: palette.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <History size={17} color={palette.txt} />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              onPress={() => router.push(`/room/${roomId}/edit` as any)}
              activeOpacity={0.7}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: palette.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <Settings size={17} color={palette.txt} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
          maxWidth: 540,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Code Card with QR Code (Full fidelity) */}
        <RoomCodeCard
          code={room.code}
          qrImage={qrImage}
          qrLoading={qrLoading}
          isCopied={isCopied}
          showQrExpanded={showQrExpanded}
          membersCount={members.length}
          onCopy={handleCopyCode}
          onShare={handleShare}
          onToggleQr={() => setShowQrExpanded(!showQrExpanded)}
        />

        {/* Invite Friends Button */}
        <TouchableOpacity
          onPress={() => setShowInviteModal(true)}
          activeOpacity={0.85}
          style={{
            height: 48,
            borderRadius: 16,
            backgroundColor: `${palette.primary}18`,
            borderWidth: 1.5,
            borderColor: `${palette.primary}33`,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <UserPlus size={18} color={palette.primary} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.primary }}>
            Inviter des amis
          </Text>
        </TouchableOpacity>

        {/* Active Sessions or Create & Launch CTA */}
        {activeSessions.length > 0 ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: palette.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>
              Session active
            </Text>
            {activeSessions.map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                members={members}
                onPress={() => navigateToSession(session)}
                onDelete={() => handleDeleteSession(session.id, session.code)}
                canDelete={isOwner || session.managerId === user?.id}
                isOwner={isOwner}
              />
            ))}
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowConfigModal(true)}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 16,
              backgroundColor: palette.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
              shadowColor: palette.primary,
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Play size={18} color={palette.primaryInk} fill="currentColor" />
            <Text style={{ color: palette.primaryInk, fontSize: 15, fontWeight: '700' }}>
              CRÉER & LANCER UNE SESSION
            </Text>
          </TouchableOpacity>
        )}

        {/* Members & Stats List */}
        <MembersWithStats
          members={members}
          rankings={rankings}
          currentUserId={user?.id ?? ''}
          onAddFriend={handleSendFriendRequest}
        />

        {/* Danger Zone */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.line,
            overflow: 'hidden',
            marginTop: 4,
          }}
        >
          {!isOwner ? (
            <TouchableOpacity
              onPress={handleLeaveRoom}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 10,
              }}
            >
              <LogOut size={16} color={palette.bad} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.bad }}>
                Quitter le salon
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleDeleteRoom}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 10,
              }}
            >
              <Trash2 size={16} color={palette.bad} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.bad }}>
                Supprimer le salon
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* History Modal */}
      <HistoryModal
        visible={showHistoryModal}
        sessions={pastSessions}
        onNavigate={navigateToSession}
        onClose={() => setShowHistoryModal(false)}
      />

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        visible={showInviteModal}
        roomId={(roomId as string) ?? ''}
        memberUserIds={members.map((m) => m.userId)}
        pendingInvitationUserIds={roomData?.pendingInvitationUserIds ?? []}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Session Config Modal */}
      {showConfigModal && (
        <Modal visible={showConfigModal} animationType="slide" onRequestClose={() => setShowConfigModal(false)}>
          <SessionConfigForm
            roomId={(roomId as string) ?? ''}
            onSuccess={handleSessionCreated}
            onClose={() => setShowConfigModal(false)}
            initialMaxPlayers={members.length || undefined}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}
