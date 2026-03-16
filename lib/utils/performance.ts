/**
 * Utilitaires pour mesurer et optimiser les performances du jeu
 */

interface BuzzLatencyMetrics {
  clientTimestamp: number;
  serverTimestamp?: number;
  roundTripTime?: number;
  uiUpdateTime: number;
}

class PerformanceMonitor {
  private buzzMetrics: BuzzLatencyMetrics[] = [];
  private maxMetrics = 50; // Garder les 50 derniers buzzes

  /**
   * Démarrer la mesure de latence pour un buzz
   */
  startBuzzMeasurement(): number {
    const timestamp = performance.now();
    const metrics: BuzzLatencyMetrics = {
      clientTimestamp: timestamp,
      uiUpdateTime: timestamp,
    };
    
    this.buzzMetrics.push(metrics);
    if (this.buzzMetrics.length > this.maxMetrics) {
      this.buzzMetrics.shift();
    }
    
    return timestamp;
  }

  /**
   * Terminer la mesure quand on reçoit la réponse du serveur
   */
  completeBuzzMeasurement(clientTimestamp: number, serverTimestamp?: number): void {
    const metric = this.buzzMetrics.find(m => m.clientTimestamp === clientTimestamp);
    if (metric && serverTimestamp) {
      metric.serverTimestamp = serverTimestamp;
      metric.roundTripTime = performance.now() - clientTimestamp;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Performance] Buzz latency: ${metric.roundTripTime?.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Obtenir les statistiques de latence moyennes
   */
  getLatencyStats(): {
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    recentLatency: number;
  } {
    const validMetrics = this.buzzMetrics
      .filter(m => m.roundTripTime !== undefined)
      .map(m => m.roundTripTime!);

    if (validMetrics.length === 0) {
      return { averageLatency: 0, minLatency: 0, maxLatency: 0, recentLatency: 0 };
    }

    const sum = validMetrics.reduce((a, b) => a + b, 0);
    const average = sum / validMetrics.length;
    const min = Math.min(...validMetrics);
    const max = Math.max(...validMetrics);
    const recent = validMetrics[validMetrics.length - 1] || 0;

    return {
      averageLatency: Math.round(average),
      minLatency: Math.round(min),
      maxLatency: Math.round(max),
      recentLatency: Math.round(recent),
    };
  }

  /**
   * Réinitialiser les métriques
   */
  reset(): void {
    this.buzzMetrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Utilitaire pour débouncer les actions rapides
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitMs);
  };
}

/**
 * Utilitaire pour throttler les actions (limite de fréquence)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = performance.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      func(...args);
    }
  };
}