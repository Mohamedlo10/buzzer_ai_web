'use client';

import { Card } from '~/components/ui/Card';
import type { SessionRankingEntry, DebtEntry } from '~/types/api';

interface DebtBreakdownProps {
  debts: DebtEntry[];
  currentUserId: string;
  rankings: SessionRankingEntry[];
}

export function DebtBreakdown({ debts, currentUserId, rankings }: DebtBreakdownProps) {
  if (!debts || debts.length === 0) {
    return (
      <Card className="mb-4">
        <p className="text-white/60 text-center py-4">Pas de dettes cette fois !</p>
      </Card>
    );
  }

  // Separate debts where current user is creditor vs others
  const owedToYou = debts.filter(d => d.toUserId === currentUserId);
  const youOwe = debts.filter(d => d.toUserId !== currentUserId);

  return (
    <Card className="mb-4">
      <p className="text-white font-bold text-lg mb-4">💸 Dettes par catégorie</p>

      {owedToYou.length > 0 && (
        <div className="mb-4">
          <p className="text-[#00D397] font-semibold mb-2">On te doit :</p>
          {owedToYou.map((debt, i) => (
            <div
              key={i}
              className="flex flex-row justify-between py-2 border-b border-[#3E3666] last:border-b-0"
            >
              <span className="text-white">{debt.toUsername}</span>
              <span className="text-[#00D397]">{debt.amount} pts en {debt.category}</span>
            </div>
          ))}
        </div>
      )}

      {youOwe.length > 0 && (
        <div>
          <p className="text-[#D5442F] font-semibold mb-2">Tu dois :</p>
          {youOwe.map((debt, i) => (
            <div
              key={i}
              className="flex flex-row justify-between py-2 border-b border-[#3E3666] last:border-b-0"
            >
              <span className="text-white">{debt.toUsername}</span>
              <span className="text-[#D5442F]">{debt.amount} pts en {debt.category}</span>
            </div>
          ))}
        </div>
      )}

      {youOwe.length === 0 && owedToYou.length === 0 && (
        <p className="text-white/60 text-center py-2">Aucune dette pour toi !</p>
      )}
    </Card>
  );
}
