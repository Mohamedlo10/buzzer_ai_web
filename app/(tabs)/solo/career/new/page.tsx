'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ArrowLeft, Send } from 'lucide-react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import * as soloApi from '~/lib/api/solo';

export default function NewSoloCareerPage() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = category.trim();
    if (!trimmed) return;
    if (trimmed.length < 3) {
      setError('La catégorie doit faire au moins 3 caractères.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await soloApi.createCareer(trimmed);
      router.push(`/solo/career/${response.careerId}`);
    } catch (err: any) {
      console.error('Failed to create career', err);
      const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
      if (err?.response?.status === 400 && backendMessage?.includes('limite de 3')) {
        setError('Vous ne pouvez pas avoir plus de 3 carrières actives simultanément. Abandonnez-en une avant d\'en créer une nouvelle.');
      } else {
        setError(backendMessage || 'Une erreur est survenue lors de la création de la carrière.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeScreen className="bg-bg">
      <div className="flex flex-col flex-1 px-4 pt-4 pb-8 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-3.5 mb-6">
          <button
            onClick={() => router.push('/solo/career')}
            className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center text-txt transition-colors border border-line cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-txt font-display font-bold text-2xl tracking-tight">Nouvelle Carrière</h1>
        </div>

        {/* Info card */}
        <div className="bg-surface border border-line rounded-3xl p-5 mb-6 animate-[rise_0.4s_both]">
          <div className="w-10 h-10 rounded-xl bg-energy/15 flex items-center justify-center text-energy mb-3.5">
            <Trophy size={20} />
          </div>
          <h2 className="text-txt font-bold text-base tracking-tight">Règles du Mode Carrière</h2>
          <ul className="text-txt-60 text-xs mt-3.5 space-y-2 list-disc list-inside leading-relaxed">
            <li>Choisissez un thème (ex: <i>"Histoire romaine"</i>, <i>"Geographie de l'Afrique"</i>, <i>"Pop-Rock"</i>).</li>
            <li>Le parcours se compose de <b>12 niveaux</b> de difficulté croissante (Facile → Moyen → Difficile → Extrême).</li>
            <li>Pour valider un niveau, vous devez atteindre le seuil de réussite (85% à 55% de bonnes réponses).</li>
            <li>Chaque niveau validé du 1er coup vous donne un <b>bonus de +500 pts</b>.</li>
            <li>Vous pouvez rejouer un niveau raté, mais chaque tentative ratée applique un <b>malus de -100 pts</b> sur le score final de ce niveau.</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-[rise_0.5s_both]">
          <div>
            <label className="text-txt font-semibold text-sm block mb-2">
              Quel thème souhaitez-vous conquérir ?
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setError(null);
              }}
              placeholder="Ex: Football Européen, Histoire de France, Astronomie..."
              className={`w-full bg-surface rounded-[14px] px-4 py-3.5 text-txt border-[1.5px] outline-none transition-colors focus:border-accent ${
                error ? 'border-buzz' : 'border-line'
              }`}
              maxLength={50}
              disabled={isCreating}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-buzz/10 border border-buzz/30 rounded-xl p-3.5 text-buzz-h text-xs font-semibold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating || !category.trim()}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-opacity cursor-pointer disabled:cursor-not-allowed mt-2"
            style={
              isCreating || !category.trim()
                ? { background: 'var(--surface-2)', color: 'var(--txt-40)' }
                : { background: 'linear-gradient(135deg, #00D397, #00B383)', color: '#08231B' }
            }
          >
            {isCreating ? (
              <Spinner text="Création de la carrière..." />
            ) : (
              <>
                <Send size={16} />
                Lancer la carrière
              </>
            )}
          </button>
        </form>

        {/* Bottom spacing for TabBar */}
        <div className="h-12" />
      </div>
    </SafeScreen>
  );
}
