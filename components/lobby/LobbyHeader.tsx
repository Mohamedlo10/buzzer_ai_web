import { ArrowLeft, Crown, RefreshCw } from 'lucide-react';
import type { RoomInfo } from '~/types/api';

export interface LobbyHeaderProps {
  session: any;
  roomInfo: RoomInfo | null;
  isConnected: boolean;
  isManager: boolean;
  code: string;
  isRefreshing: boolean;
  onBack: () => void;
  onRefresh: () => void;
  orbitronClass: string;
}

export function LobbyHeader({
  session,
  roomInfo,
  isConnected,
  isManager,
  code,
  isRefreshing,
  onBack,
  onRefresh,
  orbitronClass,
}: LobbyHeaderProps) {
  return (
    <div className="shrink-0 z-20 bg-bg/95 backdrop-blur-sm border-b border-line px-4 pt-4 pb-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center shrink-0 hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-txt" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className={`${orbitronClass} text-txt text-base font-bold tracking-wide`}>
            Salon d&apos;attente
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-accent' : 'bg-buzz'}`} />
            <span className={`text-[10px] font-semibold tracking-wider ${isConnected ? 'text-accent/80' : 'text-buzz/80'}`}>
              {isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
            </span>
            {roomInfo && (
              <span className="text-txt-40 text-[10px] truncate">· {roomInfo.name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-buzz/12 border border-buzz/40 text-buzz text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-buzz animate-pulse" />
            LIVE
          </span>
          {isManager && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-energy/12 border border-energy/40 text-energy text-[10px] font-bold">
              <Crown size={10} fill="var(--gold)" color="var(--gold)" />
              HOST
            </span>
          )}
          <span className={`${orbitronClass} px-2 py-1 rounded-lg bg-surface border border-line text-txt text-[10px] font-bold tracking-widest`}>
            {code}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center cursor-pointer"
          >
            <RefreshCw size={13} className={`text-txt ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
