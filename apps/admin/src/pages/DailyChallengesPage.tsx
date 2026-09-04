import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Send,
  Ban,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Spinner } from '../components/loading/Spinner';
import {
  adminApi,
  confirmAsync,
  type AdminDailyChallengeResponse,
  type DailyChallengeStatus,
} from '@xalaat/core';

/**
 * Préparation, relecture et publication du Défi du Jour.
 *
 * <p>Le principe du §8 : l'IA propose, l'administration décide. La publication est refusée
 * tant qu'une violation bloquante subsiste, et cet écran existe pour rendre ces violations
 * lisibles — l'API renvoie le rapport complet en une fois, pas la première erreur venue.
 */

const STATUS_CONFIG: Record<DailyChallengeStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'var(--txt-40)' },
  GENERATING: { label: 'Génération…', color: 'var(--warn)' },
  GENERATED: { label: 'À relire', color: 'var(--indigo)' },
  REVIEW: { label: 'En relecture', color: 'var(--indigo)' },
  PUBLISHED: { label: 'Publié', color: 'var(--good)' },
  LIVE: { label: 'En cours', color: 'var(--primary)' },
  CLOSED: { label: 'Terminé', color: 'var(--txt-40)' },
  FAILED: { label: 'Échec', color: 'var(--bad)' },
  CANCELLED: { label: 'Annulé', color: 'var(--txt-40)' },
};

const PAGE_SIZE = 20;

/** Demain, au format ISO — la valeur par défaut la plus probable à la création. */
function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DailyChallengesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [newDate, setNewDate] = useState(tomorrowIso());
  const [newTheme, setNewTheme] = useState('');
  const [newCount, setNewCount] = useState(10);

  const { data: list, isLoading } = useQuery({
    queryKey: ['admin', 'daily-challenges', page],
    queryFn: () => adminApi.getAdminDailyChallenges(page, PAGE_SIZE),
  });

  const { data: detail } = useQuery({
    queryKey: ['admin', 'daily-challenge', selectedId],
    queryFn: () => adminApi.getAdminDailyChallenge(selectedId!),
    enabled: !!selectedId,
    // Tant que la génération tourne, on interroge le détail. Un canal WebSocket dédié ne se
    // justifie pas pour un back-office à un seul utilisateur.
    refetchInterval: (query) =>
      query.state.data?.challenge.status === 'GENERATING' ? 3000 : false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'daily-challenges'] });
    if (selectedId) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'daily-challenge', selectedId] });
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createAdminDailyChallenge({
        date: newDate,
        theme: newTheme.trim() || null,
        difficulty: 'MIXTE',
        questionCount: newCount,
      }),
    onSuccess: (created) => {
      toast.success(`Brouillon créé pour le ${formatDate(created.date)}`);
      setShowCreate(false);
      setNewTheme('');
      setSelectedId(created.id);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generateMutation = useMutation({
    mutationFn: (id: string) => adminApi.generateAdminDailyChallenge(id),
    onSuccess: () => {
      toast.info('Génération lancée — les questions arrivent dans un instant.');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => adminApi.publishAdminDailyChallenge(id),
    onSuccess: (published) => {
      toast.success(`Défi du ${formatDate(published.date)} publié.`);
      invalidate();
    },
    // Le serveur répond 422 avec le rapport si une violation bloque : ce n'est pas une
    // panne, c'est un refus motivé, et le rapport reste affiché sous les questions.
    onError: () =>
      toast.error("Publication refusée : corrige d'abord les points bloquants ci-dessous."),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelAdminDailyChallenge(id),
    onSuccess: () => {
      toast.success('Édition annulée.');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onCancel = async (challenge: AdminDailyChallengeResponse) => {
    const ok = await confirmAsync({
      title: 'Annuler cette édition ?',
      message: `Le défi du ${formatDate(challenge.date)} ne sera pas proposé aux joueurs.`,
      confirmLabel: 'Annuler l’édition',
    });
    if (ok) cancelMutation.mutate(challenge.id);
  };

  if (isLoading) return <Spinner />;

  const challenges = list?.content ?? [];
  const validation = detail?.validation;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarDays size={20} />
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Défi du Jour</h1>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Nouvelle édition
        </button>
      </header>

      {showCreate && (
        <Card>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Date</span>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: '1px solid var(--line)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 220 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                Thème — laisser vide pour que l’IA choisisse
              </span>
              <input
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                placeholder="Histoire du Sénégal"
                style={{ padding: 8, borderRadius: 6, border: '1px solid var(--line)' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Questions</span>
              <input
                type="number"
                min={3}
                max={20}
                value={newCount}
                onChange={(e) => setNewCount(Number(e.target.value))}
                style={{ padding: 8, borderRadius: 6, border: '1px solid var(--line)', width: 90 }}
              />
            </label>

            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              style={{
                padding: '9px 16px', borderRadius: 8, border: 'none',
                background: 'var(--primary)', color: '#fff', cursor: 'pointer',
              }}
            >
              Créer
            </button>
          </div>
        </Card>
      )}

      <Card>
        {challenges.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>
            Aucune édition pour l’instant.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: 12, opacity: 0.6 }}>
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Thème</th>
                <th style={{ padding: 10 }}>Questions</th>
                <th style={{ padding: 10 }}>État</th>
                <th style={{ padding: 10 }} />
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => {
                const status = STATUS_CONFIG[c.status];
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    style={{
                      borderTop: '1px solid var(--line)',
                      cursor: 'pointer',
                      background: c.id === selectedId ? 'var(--surface-2)' : undefined,
                    }}
                  >
                    <td style={{ padding: 10 }}>{formatDate(c.date)}</td>
                    <td style={{ padding: 10 }}>
                      {c.resolvedTheme ?? c.theme ?? (
                        <span style={{ opacity: 0.5 }}>thème automatique</span>
                      )}
                    </td>
                    <td style={{ padding: 10 }}>{c.questionCount}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{ color: status.color, fontWeight: 600, fontSize: 13 }}>
                        {status.label}
                      </span>
                      {c.generationError && (
                        <div style={{ fontSize: 11, color: 'var(--bad)', marginTop: 2 }}>
                          {c.generationError}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 10, textAlign: 'right' }}>
                      {(c.status === 'DRAFT' || c.status === 'FAILED') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); generateMutation.mutate(c.id); }}
                          disabled={c.generationAttempts >= 3}
                          title={c.generationAttempts >= 3
                            ? 'Trois tentatives ont échoué : corrige le thème ou saisis les questions à la main.'
                            : undefined}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 10px', borderRadius: 6, fontSize: 12,
                            border: '1px solid var(--line)', background: 'transparent',
                            cursor: c.generationAttempts >= 3 ? 'not-allowed' : 'pointer',
                            opacity: c.generationAttempts >= 3 ? 0.4 : 1,
                          }}
                        >
                          <Sparkles size={13} /> Générer
                        </button>
                      )}
                      {!c.status.startsWith('PUBLI') && c.status !== 'LIVE' && c.status !== 'CLOSED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); void onCancel(c); }}
                          style={{
                            marginLeft: 6, padding: '5px 8px', borderRadius: 6,
                            border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer',
                          }}
                        >
                          <Ban size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Une édition par jour : la liste dépasse une page au bout d'un mois. */}
        {(list?.totalPages ?? 0) > 1 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: 12, borderTop: '1px solid var(--line)',
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid var(--line)',
                background: 'transparent', cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.4 : 1,
              }}
            >
              Précédent
            </button>
            <span style={{ fontSize: 13, opacity: 0.7 }}>
              Page {page + 1} sur {list?.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= (list?.totalPages ?? 1)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid var(--line)',
                background: 'transparent',
                cursor: page + 1 >= (list?.totalPages ?? 1) ? 'not-allowed' : 'pointer',
                opacity: page + 1 >= (list?.totalPages ?? 1) ? 0.4 : 1,
              }}
            >
              Suivant
            </button>
          </div>
        )}
      </Card>

      {detail && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>
              {formatDate(detail.challenge.date)}
              {detail.challenge.resolvedTheme && ` — ${detail.challenge.resolvedTheme}`}
            </h2>

            {(detail.challenge.status === 'GENERATED' || detail.challenge.status === 'REVIEW') && (
              <button
                onClick={() => publishMutation.mutate(detail.challenge.id)}
                disabled={!validation?.publishable || publishMutation.isPending}
                title={validation?.publishable
                  ? undefined
                  : 'Des points bloquants doivent être corrigés avant publication.'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, border: 'none', color: '#fff',
                  background: validation?.publishable ? 'var(--good)' : 'var(--txt-40)',
                  cursor: validation?.publishable ? 'pointer' : 'not-allowed',
                }}
              >
                <Send size={15} /> Publier
              </button>
            )}
          </div>

          {validation && validation.violations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {validation.violations.map((v, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '7px 10px', marginBottom: 5, borderRadius: 6, fontSize: 13,
                    background: v.blocking ? 'rgba(220,50,50,0.08)' : 'rgba(230,160,30,0.08)',
                  }}
                >
                  {v.blocking
                    ? <XCircle size={15} color="var(--bad)" style={{ flexShrink: 0, marginTop: 2 }} />
                    : <AlertTriangle size={15} color="var(--warn)" style={{ flexShrink: 0, marginTop: 2 }} />}
                  <span>
                    {v.questionIndex !== null && (
                      <strong>Question {v.questionIndex + 1} — </strong>
                    )}
                    {v.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {validation?.publishable && validation.violations.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--good)' }}>
              <CheckCircle2 size={16} /> Relecture automatique : rien à signaler.
            </div>
          )}

          {detail.questions.map((q) => (
            <div key={q.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {q.orderIndex + 1}. {q.text}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {q.choices.map((choice, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '3px 9px', borderRadius: 999, fontSize: 12,
                      border: '1px solid var(--line)',
                      background: i === q.correctIndex ? 'rgba(60,180,110,0.15)' : 'transparent',
                      fontWeight: i === q.correctIndex ? 600 : 400,
                    }}
                  >
                    {choice}
                  </span>
                ))}
              </div>
              {q.explanation && (
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>{q.explanation}</div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
