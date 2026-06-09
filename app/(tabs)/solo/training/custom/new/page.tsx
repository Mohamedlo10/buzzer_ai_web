'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import * as soloApi from '~/lib/api/solo';

const LOADING_STEPS = [
  'Initialisation du moteur de génération IA...',
  'Génération de la base de questions...',
  'Création des leurres et de la bonne réponse...',
  'Ajustement des sous-difficultés (Tours 1, 2, 3)...',
  'Validation des questions et des explications...',
  'Finalisation et stockage du plan d\'entraînement...',
];

const DIFFICULTIES = [
  { value: 'FACILE', label: 'Facile', desc: 'Questions accessibles, idéal pour réviser les bases.' },
  { value: 'MOYEN', label: 'Moyen', desc: 'Bon équilibre entre connaissance générale et détails.' },
  { value: 'DIFFICILE', label: 'Difficile', desc: 'Demande des connaissances approfondies sur le sujet.' },
  { value: 'EXTREME', label: 'Extrême', desc: 'Réservé aux experts. Les moindres détails comptent.' },
];

export default function NewCustomTrainingPage() {
  const router = useRouter();
  const [theme, setTheme] = useState('');
  const [difficulty, setDifficulty] = useState('FACILE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Rotate loading step messages
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = theme.trim();
    if (!trimmed) return;
    if (trimmed.length < 3) {
      setError('Le thème doit faire au moins 3 caractères.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLoadingStepIndex(0);

    try {
      const response = await soloApi.createCustomTraining(trimmed, difficulty);
      router.push(`/solo/training/${response.planId}`);
    } catch (err: any) {
      console.error('Failed to generate training plan', err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Une erreur est survenue lors de la génération IA. Veuillez réessayer.'
      );
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center px-6 max-w-sm animate-[pop_0.4s_both]">
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-dashed border-accent flex items-center justify-center text-accent mb-6 animate-spin duration-[6000ms]">
            <Brain size={36} className="animate-pulse" />
          </div>
          
          <div className="flex items-center gap-2 text-accent font-bold text-lg tracking-tight mb-2">
            <Sparkles size={18} className="animate-pulse text-energy" />
            <span>Génération IA en cours</span>
          </div>
          
          <p className="text-txt-60 text-sm h-12 flex items-center justify-center transition-all duration-300 font-medium px-4">
            {LOADING_STEPS[loadingStepIndex]}
          </p>
          
          <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-accent animate-[growx_25s_linear_infinite] origin-left" />
          </div>
          
          <p className="text-txt-40 text-[11px] mt-4 leading-normal">
            Cette opération peut prendre 15 à 30 secondes. Ne fermez pas l'application.
          </p>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-bg">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-8 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-3.5 mb-6">
          <button
            onClick={() => router.push('/solo/training')}
            className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center text-txt transition-colors border border-line cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-txt font-display font-bold text-2xl tracking-tight">Générer un plan</h1>
        </div>

        {/* Info Box */}
        <div className="bg-surface border border-line rounded-3xl p-5 mb-6 animate-[rise_0.4s_both]">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent mb-3.5">
            <Sparkles size={20} />
          </div>
          <h2 className="text-txt font-bold text-base tracking-tight">Génération par IA</h2>
          <p className="text-txt-60 text-xs mt-2 leading-relaxed">
            Saisissez n'importe quel sujet de votre choix. Notre IA va créer un parcours d'entraînement unique structuré en <b>3 sous-niveaux</b> de difficulté progressive pour tester vos connaissances.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-[rise_0.5s_both]">
          <div>
            <label className="text-txt font-semibold text-sm block mb-2">
              Sujet de l'entraînement
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value);
                setError(null);
              }}
              placeholder="Ex: Révolution française, Javascript, Manga..."
              className={`w-full bg-surface rounded-[14px] px-4 py-3.5 text-txt border-[1.5px] outline-none transition-colors focus:border-accent ${
                error ? 'border-buzz' : 'border-line'
              }`}
              maxLength={50}
              disabled={isGenerating}
              autoFocus
            />
          </div>

          <div>
            <label className="text-txt font-semibold text-sm block mb-2.5">
              Difficulté globale
            </label>
            <div className="flex flex-col gap-2">
              {DIFFICULTIES.map((diff) => {
                const isSelected = difficulty === diff.value;
                return (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setDifficulty(diff.value)}
                    className={`w-full text-left rounded-xl p-3 border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-accent/10 border-accent text-accent shadow-glow-success'
                        : 'bg-surface border-line text-txt-60 hover:bg-surface-2'
                    }`}
                  >
                    <p className="font-bold text-sm">{diff.label}</p>
                    <p className="text-xs mt-0.5 opacity-80 leading-normal">{diff.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-buzz/10 border border-buzz/30 rounded-xl p-3.5 text-buzz-h text-xs font-semibold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || !theme.trim()}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-opacity cursor-pointer disabled:cursor-not-allowed mt-2"
            style={
              isGenerating || !theme.trim()
                ? { background: 'var(--surface-2)', color: 'var(--txt-40)' }
                : { background: 'linear-gradient(135deg, #00D397, #00B383)', color: '#08231B' }
            }
          >
            <Send size={16} />
            Lancer la génération IA
          </button>
        </form>

        {/* Bottom spacing for TabBar */}
        <div className="h-12" />
      </div>
    </SafeScreen>
  );
}
