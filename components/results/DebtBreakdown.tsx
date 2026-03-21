'use client';

import { Card } from '~/components/ui/Card';
import type { DebtEntry } from '~/types/api';

interface DebtBreakdownProps {
  debts: DebtEntry[];
}

export function DebtBreakdown({ debts }: DebtBreakdownProps) {
  if (!debts || debts.length === 0) {
    return (
      <Card className="mb-4">
        <p className="text-white/60 text-center py-4">Pas de dettes cette fois !</p>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <p className="text-white font-bold text-lg mb-4">💸 Dettes par catégorie</p>
      <div>
        <p className="text-[#D5442F] font-semibold mb-2">Tu dois :</p>
        {debts.map((debt, i) => (
          <div
            key={i}
            className="flex flex-row justify-between py-2 border-b border-[#3E3666] last:border-b-0"
          >
            <span className="text-white">{debt.owedTo}</span>
            <span className="text-[#D5442F]">{debt.amount} pts en {debt.category}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
