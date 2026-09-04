import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gamepad2 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { useLobbySession } from '~/lib/hooks/useLobbySession';
import { useAppStateReconnect } from '~/lib/websocket';
import { palette, font } from '~/lib/theme/tokens';
import { notify } from '~/lib/ui/notify';

// Dedicated Lobby Components
import { LobbyHeader } from '~/components/lobby/LobbyHeader';
import { LobbyHero } from '~/components/lobby/LobbyHero';
import { MyCategoriesCard } from '~/components/lobby/MyCategoriesCard';
import { LobbyWaitingCard } from '~/components/lobby/LobbyWaitingCard';
import { ManagerPanel } from '~/components/lobby/ManagerPanel';
import { PlayerGrid } from '~/components/lobby/PlayerGrid';
import { ArcadeTeamsSection } from '~/components/lobby/ArcadeTeamsSection';
import { QRCodeModal } from '~/components/shared/QRCodeModal';
import { TeamPickerModal } from '~/components/lobby/TeamPickerModal';
import { QuestionLimitModal } from '~/components/lobby/QuestionLimitModal';
import { LobbyPlayerDetailModal } from '~/components/lobby/LobbyPlayerDetailModal';

const CATEGORY_EMOJI: Record<string, string> = {
  Histoire: '📜',
  Science: '🔬',
  Sports: '🏆',
  Géographie: '🌍',
  'Culture G': '🌐',
  Cinéma: '🎬',
  Musique: '🎵',
  Jeux: '🎮',
  Littérature: '📚',
  Animaux: '🐾',
};

export default function LobbyScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  // Automatic WS reconnect when coming back to foreground
  useAppStateReconnect();

  const {
    isCopied,
    setIsCopied,
    isRefreshing,
    isDeletingSession,
    kickingPlayerId,
    roomInfo,
    showQRModal,
    setShowQRModal,
    showTeamPicker,
    setShowTeamPicker,
    teamPickerTargetPlayer,
    setTeamPickerTargetPlayer,
    isChangingTeam,
    showQLimit,
    setShowQLimit,
    adjustedQPerCat,
    setAdjustedQPerCat,
    isSavingConfig,
    avatarMap,
    profileUserId: _profileUserId,
    setProfileUserId: _setProfileUserId,
    selectedLobbyPlayer,
    setSelectedLobbyPlayer,
    reqOpen,
    setReqOpen,
    reqText,
    setReqText,
    reqSent,
    user,
    session,
    players,
    teams,
    isManager,
    currentPlayer,
    isConnected,
    isStarting,
    managerPlayer,
    realPlayerCount,
    canStart,
    isWithoutModerator,
    totalQuestionsEstimate,
    handleStartGame: _handleStartGame,
    handleManagerStartClick,
    handleStartWithAdjustedQ,
    handleLeave,
    handleDeleteSession,
    handleKickPlayer,
    handleAssignTeam,
    handleChangeTeam: _handleChangeTeam,
    handleManagerReassign: _handleManagerReassign,
    handleRefresh,
    handleSendCategoryRequest,
  } = useLobbySession({
    code: (code as string) || '',
    onNavigate: (path) => router.push(path as any),
    onReplaceRoute: (path) => router.replace(path as any),
  });

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code as string);
      setIsCopied(true);
      notify.success('Code copié !');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!code) return;
    const msg = `Rejoins ma partie sur Xalaat ! Code : ${code}`;
    try {
      await Share.share({
        message: msg,
        title: 'Invitation Xalaat — Quiz by MouhaDev',
      });
    } catch {
      // cancelled
    }
  };

  const handleEditMyCategories = () => {
    const me = players.find((p) => p.userId === user?.id);
    if (!me) return;
    router.push(
      `/session/${code}/categories?playerId=${me.id}&playerName=${encodeURIComponent(me.name)}&isEditing=true&sessionId=${session?.id || ''}` as any
    );
  };

  const handleEditPlayerCategories = (player: { id: string; name: string }) => {
    router.push(
      `/session/${code}/categories?playerId=${player.id}&playerName=${encodeURIComponent(player.name)}&isEditing=true&sessionId=${session?.id || ''}` as any
    );
  };

  if (!session) {
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
          <Gamepad2 size={32} color={palette.primary} />
        </View>
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 16,
            lineHeight: 22,
            color: palette.txt,
            paddingTop: 2,
            letterSpacing: 1,
          }}
        >
          CHARGEMENT DU LOBBY...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <LobbyHeader
        session={session}
        roomInfo={roomInfo}
        isConnected={isConnected}
        isManager={isManager}
        code={(code as string) || ''}
        isRefreshing={isRefreshing}
        onBack={() => {
          if (session?.roomId) {
            router.replace(`/room/${session.roomId}` as any);
          } else {
            router.replace('/(tabs)/rooms' as any);
          }
        }}
        onRefresh={handleRefresh}
      />

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
        {/* Lobby Hero */}
        <LobbyHero
          currentPlayer={currentPlayer}
          user={user}
          avatarMap={avatarMap}
          isWithoutModerator={isWithoutModerator}
          questionMode={session.questionMode}
          totalQuestions={session.totalQuestions}
          totalQuestionsEstimate={totalQuestionsEstimate}
          playersCount={players.length}
          maxPlayers={session.maxPlayers}
          code={(code as string) || ''}
          isCopied={isCopied}
          onCopyCode={handleCopyCode}
          onShare={handleShare}
          onShowQR={() => setShowQRModal(true)}
        />

        {/* My Categories Card */}
        <MyCategoriesCard
          currentPlayer={currentPlayer}
          session={session}
          questionMode={session.questionMode}
          onEditCategories={handleEditMyCategories}
          reqOpen={reqOpen}
          setReqOpen={setReqOpen}
          reqSent={reqSent}
          reqText={reqText}
          setReqText={setReqText}
          onSendCategoryRequest={handleSendCategoryRequest}
          categoryEmojiMap={CATEGORY_EMOJI}
        />

        {/* Waiting Card (for non-managers) */}
        <LobbyWaitingCard
          isManager={isManager}
          managerPlayer={managerPlayer}
          currentPlayer={currentPlayer}
          questionMode={session.questionMode}
          onEditCategories={handleEditMyCategories}
        />

        {/* Manager Control Panel */}
        {isManager && (
          <ManagerPanel
            session={session}
            code={(code as string) || ''}
            isStarting={isStarting}
            canStart={canStart}
            isDeletingSession={isDeletingSession}
            onNavigateToQuestions={() =>
              router.push(`/session/${code}/questions?sessionId=${session.id}` as any)
            }
            onManagerStartClick={handleManagerStartClick}
            onLeave={handleLeave}
            onDeleteSession={handleDeleteSession}
          />
        )}

        {/* Connected Players Grid */}
        <PlayerGrid
          players={players}
          currentUserId={user?.id}
          isManager={isManager}
          questionMode={session.questionMode}
          sessionMode={session.sessionMode}
          avatarMap={avatarMap}
          kickingPlayerId={kickingPlayerId}
          onSelectPlayer={(p) => setSelectedLobbyPlayer(p)}
          onEditCategories={(p) => handleEditPlayerCategories(p)}
          onKickPlayer={(id, name) => handleKickPlayer(id, name)}
        />

        {/* Teams Section (for Arcade Teams mode) */}
        {teams && teams.length > 0 && (
          <ArcadeTeamsSection
            teams={teams}
            currentPlayerId={currentPlayer?.id ?? null}
            isManager={isManager}
            userId={user?.id}
            avatarMap={avatarMap}
            onChangeTeam={() => {
              if (currentPlayer) {
                setTeamPickerTargetPlayer({ id: currentPlayer.id, name: currentPlayer.name });
                setShowTeamPicker(true);
              }
            }}
            onManagerReassign={(id, name) => {
              setTeamPickerTargetPlayer({ id, name });
              setShowTeamPicker(true);
            }}
          />
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        type="session"
        id={session.id}
        code={(code as string) || ''}
        title="Rejoindre la partie"
      />

      {/* Team Picker Modal */}
      <TeamPickerModal
        visible={showTeamPicker}
        teams={teams || []}
        targetPlayer={teamPickerTargetPlayer}
        isChangingTeam={isChangingTeam}
        onAssignTeam={(playerId, teamId) => {
          handleAssignTeam(playerId, teamId);
        }}
        onClose={() => {
          setShowTeamPicker(false);
          setTeamPickerTargetPlayer(null);
        }}
      />

      {/* Question Limit Adjustment Modal */}
      <QuestionLimitModal
        visible={showQLimit}
        session={session}
        realPlayerCount={realPlayerCount}
        adjustedQPerCat={adjustedQPerCat}
        setAdjustedQPerCat={setAdjustedQPerCat}
        isSavingConfig={isSavingConfig}
        isStarting={isStarting}
        onClose={() => setShowQLimit(false)}
        onStartWithAdjustedQ={handleStartWithAdjustedQ}
      />

      {/* Player Detail Modal */}
      <LobbyPlayerDetailModal
        visible={Boolean(selectedLobbyPlayer)}
        player={selectedLobbyPlayer}
        currentUserId={user?.id}
        isManager={isManager}
        questionMode={session.questionMode}
        sessionMode={session.sessionMode}
        categorySelectionMode={session.categorySelectionMode}
        teams={teams || []}
        avatarMap={avatarMap}
        onClose={() => setSelectedLobbyPlayer(null)}
        onViewStats={(userId) => {
          setSelectedLobbyPlayer(null);
          router.push(`/profile/${userId}` as any);
        }}
        onEditCategories={(p) => {
          setSelectedLobbyPlayer(null);
          handleEditPlayerCategories(p);
        }}
        onKickPlayer={(id, name) => {
          setSelectedLobbyPlayer(null);
          handleKickPlayer(id, name);
        }}
        categoryEmojiMap={CATEGORY_EMOJI}
      />
    </SafeAreaView>
  );
}
