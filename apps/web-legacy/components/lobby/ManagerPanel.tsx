import { Play, AlertCircle, LogOut, Trash2 } from 'lucide-react';
import type { SessionResponse } from '~/types/api';
import { ManualQuestionsAlert } from './ManualQuestionsAlert';

export interface ManagerPanelProps {
  session: SessionResponse;
  code: string;
  isStarting: boolean;
  canStart: boolean;
  isDeletingSession: boolean;
  onNavigateToQuestions: () => void;
  onManagerStartClick: () => void;
  onLeave: () => void;
  onDeleteSession: () => void;
  orbitronClass: string;
  rajdhaniClass: string;
}

export function ManagerPanel({
  session,
  code,
  isStarting,
  canStart,
  isDeletingSession,
  onNavigateToQuestions,
  onManagerStartClick,
  onLeave,
  onDeleteSession,
  orbitronClass,
  rajdhaniClass,
}: ManagerPanelProps) {
  return (
    <div className="mb-4">
      {session.questionMode === 'MANUAL' && (
        <ManualQuestionsAlert
          totalQuestions={session.totalQuestions}
          sessionId={session.id}
          code={code}
          onNavigate={onNavigateToQuestions}
        />
      )}

      <button
        type="button"
        onClick={onManagerStartClick}
        disabled={isStarting || !canStart}
        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-2.5 mb-2.5 transition-all ${
          canStart && !isStarting
            ? 'bg-accent hover:bg-accent-d shadow-glow-success'
            : 'bg-surface-2 border border-line cursor-not-allowed'
        }`}
      >
        {isStarting ? (
          <>
            <div className="w-5 h-5 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
            <span className={`${orbitronClass} text-btn-fg text-lg font-bold`}>DÉMARRAGE…</span>
          </>
        ) : (
          <>
            <span className="dotpulse" style={{ background: canStart ? 'var(--primary-ink)' : 'var(--txt-40)' }} />
            <Play size={20} className={canStart ? 'text-btn-fg' : 'text-txt-40'} fill="currentColor" />
            <span className={`${orbitronClass} text-lg font-bold tracking-wide ${canStart ? 'text-btn-fg' : 'text-txt-40'}`}>
              Lancer la partie
            </span>
          </>
        )}
      </button>

      {!canStart && !isStarting && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px 0 6px', marginBottom: 8 }}>
          <AlertCircle size={13} color="var(--bad)" />
          <span className={rajdhaniClass} style={{ fontSize: 13, color: 'var(--bad)' }}>Minimum 2 joueurs requis</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onLeave}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer',
            background: 'rgb(var(--bad-rgb) / 0.071)', border: '1px solid rgb(var(--bad-rgb) / 0.188)',
          }}
        >
          <LogOut size={15} color="var(--bad)" />
          <span className={rajdhaniClass} style={{ fontSize: 13, fontWeight: 600, color: 'var(--bad)' }}>Quitter</span>
        </button>
        <button
          onClick={onDeleteSession}
          disabled={isDeletingSession}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer',
            background: 'rgb(var(--bad-rgb) / 0.071)', border: '1px solid rgb(var(--bad-rgb) / 0.188)',
          }}
        >
          {isDeletingSession ? (
            <div style={{ width: 14, height: 14, border: '2px solid var(--bad)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          ) : (
            <Trash2 size={15} color="var(--bad)" />
          )}
          <span className={rajdhaniClass} style={{ fontSize: 13, fontWeight: 600, color: 'var(--bad)' }}>Supprimer</span>
        </button>
      </div>
    </div>
  );
}
