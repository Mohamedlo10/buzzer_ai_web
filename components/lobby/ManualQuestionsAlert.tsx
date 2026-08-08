import { PenLine, AlertCircle } from 'lucide-react';

export function ManualQuestionsAlert({
  totalQuestions,
  sessionId,
  code,
  onNavigate,
}: {
  totalQuestions: number;
  sessionId: string;
  code: string;
  onNavigate: () => void;
}) {
  const has = totalQuestions > 0;
  return (
    <div className="rounded-[14px] bg-surface border border-energy/15 mb-3 overflow-hidden">
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-energy/10 flex items-center justify-center">
            <PenLine size={16} className="text-energy" />
          </div>
          <div>
            <p className="text-txt font-bold text-[13px]">Questions manuelles</p>
            <p className="text-txt-60 text-[11px]">
              {has ? `${totalQuestions} question(s) prête(s)` : 'Aucune question saisie'}
            </p>
          </div>
        </div>
        <button
          onClick={onNavigate}
          className="px-3 py-1.5 rounded-[9px] bg-energy/10 border border-energy/20 text-energy text-xs font-semibold cursor-pointer hover:bg-energy/15 transition-colors"
        >
          {has ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
      {!has && (
        <div className="px-3.5 pb-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-buzz/5 border border-buzz/15">
            <AlertCircle size={12} className="text-buzz shrink-0" />
            <span className="text-buzz text-[11px]">Ajoutez des questions avant de démarrer</span>
          </div>
        </div>
      )}
    </div>
  );
}
