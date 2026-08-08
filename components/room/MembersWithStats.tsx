import { Crown, Medal } from 'lucide-react';
import { Avatar } from '~/components/shared/Avatar';
import { FriendshipButton } from '~/components/ui/FriendshipButton';
import type { RoomDetailResponse } from '~/types/api';

export function MembersWithStats({
  members,
  rankings,
  currentUserId,
  onAddFriend,
  onSelectUser,
}: {
  members: RoomDetailResponse['members'];
  rankings: RoomDetailResponse['rankings'];
  currentUserId: string;
  onAddFriend: (userId: string, username: string) => void;
  onSelectUser?: (member: RoomDetailResponse['members'][number]) => void;
}) {
  // Merge: for each member find their ranking stats, sort by ratio pts/partie desc
  const merged = members
    .map((m) => {
      const rank = rankings.find((r) => r.userId === m.userId);
      const ratio = rank && rank.gamesPlayed > 0
        ? rank.totalScore / rank.gamesPlayed
        : 0;
      return { member: m, rank, ratio };
    })
    .sort((a, b) => b.ratio - a.ratio);

  const rankColors = ['var(--gold)', '#C0C0C0', '#CD7F32'];

  return (
    <div className="bg-surface rounded-3xl border border-line">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase">Membres</p>
        <div className="bg-accent/15 px-3 py-1 rounded-full">
          <span className="text-accent text-xs font-bold">{members.length} Joueur{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {merged.map(({ member, rank, ratio }, index) => {
        const isCurrentUser = member.userId === currentUserId;
        const color = rankColors[index] ?? '#FFFFFF60';
        const hasPlayed = (rank?.gamesPlayed ?? 0) > 0;

        return (
          <div
            key={member.id}
            onClick={() => onSelectUser?.(member)}
            className={`flex items-center py-3 px-4 border-b border-line last:border-b-0 cursor-pointer hover:bg-white/5 transition-colors ${isCurrentUser ? 'bg-accent/5' : ''}`}
          >
            {/* Rank badge */}
            <div className="w-8 flex items-center justify-center mr-2 shrink-0">
              {index === 0 && hasPlayed && <Crown size={16} color="var(--gold)" />}
              {index === 1 && hasPlayed && <Medal size={16} color="#C0C0C0" />}
              {index === 2 && hasPlayed && <Medal size={16} color="#CD7F32" />}
              {(!hasPlayed || index > 2) && (
                <span className="text-txt-40 text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="relative mr-3 shrink-0">
              <Avatar name={member.username} avatarUrl={member.avatarUrl} size={36} />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${member.isOnline ? 'bg-accent' : 'bg-txt-40'}`} />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-semibold text-sm ${isCurrentUser ? 'text-accent' : 'text-txt'}`}>
                  {member.username}
                </span>
                {member.isOwner && (
                  <div className="flex items-center px-1.5 py-0.5 rounded-full bg-energy/15">
                    <Crown size={10} color="var(--gold)" />
                    <span className="text-energy text-[10px] font-medium ml-0.5">Chef</span>
                  </div>
                )}
              </div>
              <span className="text-txt-40 text-xs">
                {member.isOnline ? 'En ligne' : 'Hors ligne'}
                {hasPlayed ? ` • ${rank!.gamesPlayed} partie${rank!.gamesPlayed > 1 ? 's' : ''}` : ''}
              </span>
            </div>

            {/* Stats */}
            {hasPlayed && (
              <div className="text-right mr-3 shrink-0">
                <p className="font-bold text-sm" style={{ color }}>{Math.round(ratio)} <span className="text-txt-40 text-[10px] font-normal">moy</span></p>
                <p className="text-txt-40 text-[10px]">{rank!.gamesWon} 🏆</p>
              </div>
            )}

            <div onClick={(e) => e.stopPropagation()}>
              <FriendshipButton
                status={member.friendshipStatus}
                isCurrentUser={isCurrentUser}
                onAddFriend={() => onAddFriend(member.userId, member.username)}
                size="sm"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
