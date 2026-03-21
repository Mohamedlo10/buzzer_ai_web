import type { PlayerResponse, SessionRankingEntry, DebtEntry } from '~/types/api';

/**
 * Calculate debts based on category performance
 * Formula: (Winner Score - Player Score) × Debt Amount
 */
export function calculateDebts(
  players: PlayerResponse[],
  categoryScores: Record<string, Record<string, number>>,
  debtMultiplier: number,
): DebtEntry[] {
  const debts: DebtEntry[] = [];
  const categories = Object.keys(categoryScores);

  categories.forEach((category) => {
    const scores = categoryScores[category];
    if (!scores) return;

    // Find winner in this category
    let maxScore = -1;
    let winnerId = '';
    let winnerName = '';

    Object.entries(scores).forEach(([playerId, score]) => {
      if (score > maxScore) {
        maxScore = score;
        winnerId = playerId;
        const player = players.find((p) => p.id === playerId);
        winnerName = player?.name || 'Unknown';
      }
    });

    // Calculate debts for non-winners
    Object.entries(scores).forEach(([playerId, score]) => {
      if (playerId !== winnerId && maxScore > score) {
        const difference = maxScore - score;
        const calculatedDebt = difference * debtMultiplier;
        const player = players.find((p) => p.id === playerId);
        
        if (calculatedDebt > 0) {
          debts.push({
            owedTo: winnerName,
            category,
            amount: calculatedDebt,
          });
        }
      }
    });
  });

  return debts;
}

/**
 * Calculate net debt balance for a specific player
 */
export function calculateNetDebt(
  debts: DebtEntry[],
  _playerId: string,
  _playerName: string,
): {
  owedToOthers: number;
  owedByOthers: number;
  net: number;
  details: {
    youOwe: DebtEntry[];
    owedToYou: DebtEntry[];
  };
} {
  // Debts are now server-computed and represent what the player owes to others
  const owedToOthers = debts.reduce((sum, d) => sum + d.amount, 0);

  return {
    owedToOthers,
    owedByOthers: 0,
    net: -owedToOthers,
    details: {
      youOwe: debts,
      owedToYou: [],
    },
  };
}

/**
 * Format debt amount for display
 */
export function formatDebt(amount: number): string {
  if (amount === 0) return '0 pt';
  if (amount === 1) return '1 pt';
  return `${amount} pts`;
}

/**
 * Get debt summary by category
 */
export function getDebtByCategory(debts: DebtEntry[]): Record<string, {
  total: number;
  count: number;
}> {
  const byCategory: Record<string, { total: number; count: number }> = {};

  debts.forEach((debt) => {
    if (!byCategory[debt.category]) {
      byCategory[debt.category] = { total: 0, count: 0 };
    }
    byCategory[debt.category].total += debt.amount;
    byCategory[debt.category].count += 1;
  });

  return byCategory;
}
