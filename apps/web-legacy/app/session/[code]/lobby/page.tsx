'use client';

import { useRouter, useParams } from 'next/navigation';
import { Play, DoorOpen, Gamepad2 } from 'lucide-react';
import { Orbitron, Rajdhani } from 'next/font/google';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { QRCodeModal } from '~/components/ui/QRCodeModal';
import { ConfirmModal } from '~/components/ui/ConfirmModal';
import { PlayerProfileModal } from '~/components/ui/PlayerProfileModal';
import { notify } from '~/lib/ui/notify';

import { ArcadeTeamsSection } from '~/components/lobby/ArcadeTeamsSection';
import { LobbyHeader } from '~/components/lobby/LobbyHeader';
import { LobbyHero } from '~/components/lobby/LobbyHero';
import { MyCategoriesCard } from '~/components/lobby/MyCategoriesCard';
import { LobbyWaitingCard } from '~/components/lobby/LobbyWaitingCard';
import { ManagerPanel } from '~/components/lobby/ManagerPanel';
import { PlayerGrid } from '~/components/lobby/PlayerGrid';
import { QuestionLimitModal } from '~/components/lobby/QuestionLimitModal';
import { TeamPickerModal } from '~/components/lobby/TeamPickerModal';
import { LobbyPlayerDetailModal } from '~/components/lobby/LobbyPlayerDetailModal';
import { useLobbySession } from '~/lib/hooks/useLobbySession';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['400', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const CATEGORY_EMOJI: Record<string, string> = {
  Histoire: '📜', Science: '🔬', Sports: '🏆', Géographie: '🌍',
  'Culture G': '🌐', Cinéma: '🎬',
};

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

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
    showStartConfirm,
    setShowStartConfirm,
    profileUserId,
    setProfileUserId,
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
    handleStartGame,
    handleManagerStartClick,
    handleStartWithAdjustedQ,
    handleLeave,
    handleDeleteSession,
    handleKickPlayer,
    handleAssignTeam,
    handleChangeTeam,
    handleManagerReassign,
    handleRefresh,
    handleSendCategoryRequest,
  } = useLobbySession({
    code: code || '',
    onNavigate: (path) => router.push(path),
    onReplaceRoute: (path) => router.replace(path),
  });

  const handleCopyCode = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); } catch { /* fallback */ }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    const msg = `Rejoins ma partie sur Xalaat (Quiz by MouhaDev) ! Code: ${code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Invitation Xalaat — Quiz by MouhaDev', text: msg }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(msg);
      notify.success('Lien copié dans le presse-papiers !');
    }
  };

  const handleEditCategories = (player: { id: string; name: string }) => {
    router.push(`/session/${code}/categories?playerId=${player.id}&playerName=${encodeURIComponent(player.name)}&isEditing=true&sessionId=${session?.id || ''}`);
  };

  const handleEditMyCategories = () => {
    const me = players.find((p) => p.userId === user?.id);
    if (!me) return;
    router.push(`/session/${code}/categories?playerId=${me.id}&playerName=${encodeURIComponent(me.name)}&isEditing=true&sessionId=${session?.id || ''}`);
  };

  if (!session) {
    return (
      <SafeScreen>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-16 h-16 rounded-full bg-accent/13 border border-accent/30 flex items-center justify-center mb-4">
            <Gamepad2 size={30} className="text-accent" />
          </div>
          <p className={`${orbitron.className} text-accent text-sm font-bold tracking-widest`}>
            CHARGEMENT…
          </p>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden relative bg-transparent">
      <LobbyHeader
        session={session}
        roomInfo={roomInfo}
        isConnected={isConnected}
        isManager={isManager}
        code={code || ''}
        isRefreshing={isRefreshing}
        onBack={() => { if (session?.roomId) router.replace(`/room/${session.roomId}`); else router.replace('/'); }}
        onRefresh={handleRefresh}
        orbitronClass={orbitron.className}
      />

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y pb-28 px-4">
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
          code={code || ''}
          isCopied={isCopied}
          onCopyCode={handleCopyCode}
          onShare={handleShare}
          onShowQR={() => setShowQRModal(true)}
          orbitronClass={orbitron.className}
        />

        <MyCategoriesCard
          currentPlayer={currentPlayer}
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

        <LobbyWaitingCard
          isManager={isManager}
          managerPlayer={managerPlayer}
          currentPlayer={currentPlayer}
          questionMode={session.questionMode}
          onEditCategories={handleEditMyCategories}
          orbitronClass={orbitron.className}
        />

        {/* MANAGER CONTROLS */}
        {isManager && (
          <ManagerPanel
            session={session}
            code={code || ''}
            isStarting={isStarting}
            canStart={canStart}
            isDeletingSession={isDeletingSession}
            onNavigateToQuestions={() => router.push(`/session/${code}/questions?sessionId=${session.id}`)}
            onManagerStartClick={handleManagerStartClick}
            onLeave={handleLeave}
            onDeleteSession={handleDeleteSession}
            orbitronClass={orbitron.className}
            rajdhaniClass={rajdhani.className}
          />
        )}

        {/* TEAMS */}
        {session.isTeamMode && teams.length > 0 && (
          <ArcadeTeamsSection
            teams={teams}
            currentPlayerId={currentPlayer?.id ?? null}
            isManager={isManager}
            userId={user?.id}
            avatarMap={avatarMap}
            onChangeTeam={handleChangeTeam}
            onManagerReassign={handleManagerReassign}
            orbitronClass={orbitron.className}
            rajdhaniClass={rajdhani.className}
          />
        )}

        {/* Players grid */}
        <PlayerGrid
          players={players}
          currentUserId={user?.id}
          isManager={isManager}
          questionMode={session.questionMode}
          sessionMode={session.sessionMode}
          avatarMap={avatarMap}
          kickingPlayerId={kickingPlayerId}
          onSelectPlayer={(p) => setSelectedLobbyPlayer(p)}
          onEditCategories={(p) => handleEditCategories(p)}
          onKickPlayer={(id, name) => handleKickPlayer(id, name)}
        />

        {/* Non-manager quit */}
        {!isManager && (
          <button
            type="button"
            onClick={handleLeave}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 bg-buzz/10 border border-buzz/30 text-buzz font-bold text-sm mb-2"
          >
            <DoorOpen size={16} />
            Quitter la session
          </button>
        )}

        {!isManager && (
          <p className="text-txt-40 text-[11.5px] text-center mb-2">
            L&apos;hôte démarre quand tout le monde est prêt
          </p>
        )}
      </div>

      {/* Question Limit Modal */}
      {showQLimit && session && (
        <QuestionLimitModal
          session={session}
          realPlayerCount={realPlayerCount}
          adjustedQPerCat={adjustedQPerCat}
          setAdjustedQPerCat={setAdjustedQPerCat}
          isSavingConfig={isSavingConfig}
          isStarting={isStarting}
          onClose={() => setShowQLimit(false)}
          onStartWithAdjustedQ={handleStartWithAdjustedQ}
          orbitronClass={orbitron.className}
          rajdhaniClass={rajdhani.className}
        />
      )}

      {/* QR Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        type="session"
        id={session?.id || ''}
        code={code || ''}
        title={`Session de ${session?.managerName || 'Manager'}`}
      />

      {/* Team Picker */}
      {showTeamPicker && (
        <TeamPickerModal
          teams={teams}
          targetPlayer={teamPickerTargetPlayer}
          isChangingTeam={isChangingTeam}
          onAssignTeam={handleAssignTeam}
          onClose={() => { setShowTeamPicker(false); setTeamPickerTargetPlayer(null); }}
          orbitronClass={orbitron.className}
          rajdhaniClass={rajdhani.className}
        />
      )}

      {/* Lobby Player Details Bottom Sheet */}
      {selectedLobbyPlayer && (
        <LobbyPlayerDetailModal
          player={selectedLobbyPlayer}
          currentUserId={user?.id}
          isManager={isManager}
          questionMode={session.questionMode}
          sessionMode={session.sessionMode}
          teams={teams}
          avatarMap={avatarMap}
          onClose={() => setSelectedLobbyPlayer(null)}
          onViewStats={(uId) => setProfileUserId(uId)}
          onEditCategories={(p) => handleEditCategories(p)}
          onKickPlayer={(id, name) => handleKickPlayer(id, name)}
          categoryEmojiMap={CATEGORY_EMOJI}
        />
      )}

      <PlayerProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />

      <ConfirmModal
        open={showStartConfirm}
        title="Démarrer la partie ?"
        message={
          session?.questionMode === 'MANUAL'
            ? `${session?.totalQuestions} question(s) prête(s). Les joueurs ne pourront plus rejoindre une fois la partie lancée.`
            : 'La génération des questions va commencer. Les joueurs ne pourront plus rejoindre une fois la partie lancée.'
        }
        confirmLabel="Démarrer"
        cancelLabel="Annuler"
        tone="default"
        icon={<Play size={24} color="var(--primary)" />}
        onConfirm={() => { setShowStartConfirm(false); handleStartGame(); }}
        onCancel={() => setShowStartConfirm(false)}
      />
    </SafeScreen>
  );
}
