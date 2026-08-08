import { TrendingUp, AlertCircle, X, Play, Minus, Plus } from 'lucide-react';
import { Slider } from '~/components/ui/Slider';
import type { SessionResponse } from '~/types/api';

export interface QuestionLimitModalProps {
  session: SessionResponse;
  realPlayerCount: number;
  adjustedQPerCat: number;
  setAdjustedQPerCat: React.Dispatch<React.SetStateAction<number>>;
  isSavingConfig: boolean;
  isStarting: boolean;
  onClose: () => void;
  onStartWithAdjustedQ: () => void;
  orbitronClass: string;
  rajdhaniClass: string;
}

export function QuestionLimitModal({
  session,
  realPlayerCount,
  adjustedQPerCat,
  setAdjustedQPerCat,
  isSavingConfig,
  isStarting,
  onClose,
  onStartWithAdjustedQ,
  orbitronClass,
  rajdhaniClass,
}: QuestionLimitModalProps) {
  const cats = session.maxCategoriesPerPlayer ?? 1;
  const totalCurrent = cats * (session.questionsPerCategory ?? 1) * realPlayerCount;
  const totalAdjusted = cats * adjustedQPerCat * realPlayerCount;
  const maxAllowed = Math.max(1, Math.floor(60 / (cats * realPlayerCount)));

  return (
    <div className="fixed inset-0 bg-scrim flex items-center justify-center z-50 p-5 backdrop-blur-sm">
      <div className="w-full max-w-[360px] rounded-3xl overflow-hidden bg-surface border border-buzz/20 shadow-2xl">
        <div className="px-5 pt-[18px] pb-3.5 border-b border-line flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[11px] bg-buzz/10 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-buzz" />
          </div>
          <div>
            <p className={`${orbitronClass} text-txt font-bold text-[15px]`}>Limite dépassée</p>
            <p className={`${rajdhaniClass} text-txt-40 text-[11px]`}>Le total de questions dépasse 60</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <div style={{ borderRadius: 14, padding: '12px 14px', background: 'var(--bg)', marginBottom: 14 }}>
            <p className={`${rajdhaniClass} text-[9px] text-txt-40 tracking-[0.2em] mb-2.5`}>SITUATION ACTUELLE</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[
                { val: cats, label: 'cat/joueur', color: 'var(--violet)' },
                { val: null, label: '×', color: 'var(--txt-25)' },
                { val: session.questionsPerCategory, label: 'Q/cat', color: 'var(--indigo)' },
                { val: null, label: '×', color: 'var(--txt-25)' },
                { val: realPlayerCount, label: 'joueurs', color: 'var(--gold)' },
                { val: null, label: '=', color: 'var(--txt-25)' },
                { val: totalCurrent, label: '/ 60 max', color: 'var(--bad)', bg: 'rgb(var(--bad-rgb) / 0.063)' },
              ].map((item, i) =>
                item.val === null ? (
                  <span key={i} style={{ color: item.color, fontWeight: 700, fontSize: 14 }}>{item.label}</span>
                ) : (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 10px', borderRadius: 9, background: item.bg ?? 'var(--surface)' }}>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: 17 }}>{item.val}</span>
                    <span style={{ color: 'var(--txt-40)', fontSize: 9 }}>{item.label}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p className={`${rajdhaniClass} text-txt font-semibold text-[13px]`}>Questions par catégorie</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjustedQPerCat((v) => Math.max(1, v - 1))}
                  className="w-7 h-7 rounded-lg bg-surface-2 border border-line flex items-center justify-center cursor-pointer text-txt hover:bg-surface-2/80 transition-colors"
                >
                  <Minus size={13} />
                </button>
                <div className="px-3 py-1 rounded-lg bg-accent/10 min-w-[44px] text-center">
                  <span className="text-accent font-bold text-base">{adjustedQPerCat}</span>
                </div>
                <button
                  onClick={() => setAdjustedQPerCat((v) => Math.min(maxAllowed, v + 1))}
                  className="w-7 h-7 rounded-lg bg-surface-2 border border-line flex items-center justify-center cursor-pointer text-txt hover:bg-surface-2/80 transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
            <Slider label="" value={adjustedQPerCat} onValueChange={setAdjustedQPerCat} min={1} max={maxAllowed} suffix="" />
            <div className="flex justify-between mt-2">
              <span className={`${rajdhaniClass} text-[11px] text-txt-40`}>Total ajusté :</span>
              <span className={`${rajdhaniClass} text-xs font-semibold ${totalAdjusted <= 60 ? 'text-accent' : 'text-buzz'}`}>
                {totalAdjusted} questions
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-bg mb-4">
            <AlertCircle size={13} className="text-energy shrink-0 mt-0.5" />
            <p className={`${rajdhaniClass} text-[11px] text-txt-40 leading-relaxed`}>
              Max recommandé : <span className="text-txt font-semibold">{maxAllowed} Q/catégorie</span> avec {realPlayerCount} joueur{realPlayerCount > 1 ? 's' : ''}.
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-[14px] flex items-center justify-center gap-1.5 cursor-pointer bg-surface-2 hover:bg-surface-2/80 transition-colors"
            >
              <X size={14} className="text-txt-40" />
              <span className={`${rajdhaniClass} text-[13px] text-txt-60 font-medium`}>Annuler</span>
            </button>
            <button
              onClick={onStartWithAdjustedQ}
              disabled={isSavingConfig || isStarting}
              className="flex-1 py-3 rounded-[14px] flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-br from-accent to-accent-d disabled:opacity-60 transition-opacity"
            >
              {isSavingConfig || isStarting ? (
                <div className="w-3.5 h-3.5 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={14} className="text-btn-fg" fill="currentColor" />
              )}
              <span className={`${orbitronClass} text-[12px] font-bold text-btn-fg`}>LANCER</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
