import { useEffect, useRef, useState } from 'react';
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
  Pencil,
  Trash2,
  StopCircle,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Spinner } from '../components/loading/Spinner';
import {
  adminApi,
  apiErrorMessage,
  confirmAsync,
  type AdminDailyChallengeResponse,
  type AdminDailyQuestionResponse,
  type CreateDailyQuestionRequest,
  type UpdateDailyQuestionRequest,
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

/** Cadence du polling tant qu'une génération tourne. */
const GENERATION_POLL_MS = 3000;

/**
 * Au-delà, une génération est signalée comme anormalement longue.
 *
 * Le pire cas nominal côté serveur tient en 3 min 30 (trois tentatives et leurs attentes) ;
 * passé trois minutes, proposer l'arrêt vaut mieux que laisser deviner.
 */
const SLOW_GENERATION_SEC = 180;

/** États dans lesquels l'édition est servie aux joueurs — voir DailyChallengeStatus.isPublic(). */
const PUBLIC_STATUSES: DailyChallengeStatus[] = ['PUBLISHED', 'LIVE', 'CLOSED'];

/**
 * États depuis lesquels `cancel` est une transition légale — miroir de
 * DailyChallengeStatus.canTransitionTo.
 *
 * Une liste explicite plutôt qu'une négation : la précédente (« ni publié, ni en cours, ni
 * terminé ») affichait aussi le bouton sur une édition DÉJÀ annulée, où le serveur refuse la
 * transition et renvoie une 500 opaque.
 */
const CANCELLABLE_STATUSES: DailyChallengeStatus[] = [
  'DRAFT',
  'GENERATING',
  'GENERATED',
  'REVIEW',
  'FAILED',
];

/**
 * Question en cours de saisie. `id` absent = création, présent = correction.
 *
 * Un seul état pour les deux cas : le formulaire est identique, et deux états séparés
 * ouvriraient la porte à ce que les deux soient renseignés en même temps.
 */
interface QuestionDraft {
  id?: string;
  text: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

function emptyDraft(): QuestionDraft {
  return { text: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' };
}

function draftFromQuestion(q: AdminDailyQuestionResponse): QuestionDraft {
  return {
    id: q.id,
    text: q.text,
    choices: [...q.choices],
    correctIndex: q.correctIndex,
    explanation: q.explanation ?? '',
  };
}

const iconButtonStyle: React.CSSProperties = {
  padding: 5,
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--txt)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--txt)',
  width: '100%',
};

/**
 * Formulaire de saisie d'une question.
 *
 * <p>La bonne réponse se désigne par un bouton radio sur la proposition elle-même plutôt que
 * par un index saisi à part : un index et quatre propositions dans deux champs séparés
 * finissent toujours par diverger.
 */
function QuestionForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isSaving,
}: {
  draft: QuestionDraft;
  setDraft: (d: QuestionDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const filled = draft.text.trim().length > 0 && draft.choices.every((c) => c.trim().length > 0);

  return (
    <div
      style={{
        padding: 14, marginTop: 12, borderRadius: 10,
        border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {draft.id ? 'Corriger la question' : 'Nouvelle question'}
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          Énoncé — court : le joueur n'a que quelques secondes
        </span>
        <textarea
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          Quatre propositions — coche la bonne réponse
        </span>
        {draft.choices.map((choice, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name={`correct-${draft.id ?? 'new'}`}
              checked={draft.correctIndex === i}
              onChange={() => setDraft({ ...draft, correctIndex: i })}
              title="Bonne réponse"
              style={{ cursor: 'pointer' }}
            />
            <input
              value={choice}
              onChange={(e) => {
                const choices = [...draft.choices];
                choices[i] = e.target.value;
                setDraft({ ...draft, choices });
              }}
              placeholder={`Proposition ${i + 1}`}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Explication (facultative)</span>
        <input
          value={draft.explanation}
          onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
          style={inputStyle}
        />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSave}
          disabled={!filled || isSaving}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--primary)', color: '#fff',
            opacity: !filled || isSaving ? 0.5 : 1,
          }}
        >
          {isSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', color: 'var(--txt-60)', border: '1px solid var(--line)',
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

/**
 * Temps écoulé depuis le début d'une génération, en secondes.
 *
 * Un compteur qui avance vaut mieux qu'un libellé figé : « Génération… » immobile ne dit pas
 * si le travail progresse ou si plus personne ne s'en occupe — c'est précisément la question
 * que se posait l'administrateur devant une édition bloquée.
 */
function useElapsedSeconds(startedAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  if (!startedAt) return null;
  return Math.max(0, Math.round((now - new Date(startedAt).getTime()) / 1000));
}

function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`;
}

/**
 * Durée de la génération en cours, sous le libellé d'état.
 *
 * Un composant à part et non un appel dans la boucle du tableau : `useElapsedSeconds` est un
 * hook, il ne peut pas être appelé depuis un `map`.
 */
function GenerationElapsed({ startedAt }: { startedAt: string | null }) {
  const elapsed = useElapsedSeconds(startedAt);
  if (elapsed === null) return null;

  const slow = elapsed >= SLOW_GENERATION_SEC;
  return (
    <div style={{ fontSize: 11, marginTop: 2, color: slow ? 'var(--bad)' : 'var(--txt-60)' }}>
      {formatElapsed(elapsed)}
      {slow && ' — anormalement long, tu peux arrêter'}
    </div>
  );
}

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

  /** Question en cours de saisie ou de correction. `null` = aucun formulaire ouvert. */
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft | null>(null);

  const { data: list, isLoading } = useQuery({
    queryKey: ['admin', 'daily-challenges', page],
    queryFn: () => adminApi.getAdminDailyChallenges(page, PAGE_SIZE),
    // La liste se rafraîchit d'elle-même tant qu'une génération tourne. Sans ça, seule la
    // requête détail interrogeait le serveur : la ligne du tableau restait sur
    // « Génération… » même une fois le travail terminé, jusqu'à un rechargement manuel.
    refetchInterval: (query) =>
      query.state.data?.content.some((c) => c.status === 'GENERATING')
        ? GENERATION_POLL_MS
        : false,
  });

  const { data: detail } = useQuery({
    queryKey: ['admin', 'daily-challenge', selectedId],
    queryFn: () => adminApi.getAdminDailyChallenge(selectedId!),
    enabled: !!selectedId,
    // Tant que la génération tourne, on interroge le détail. Un canal WebSocket dédié ne se
    // justifie pas pour un back-office à un seul utilisateur.
    refetchInterval: (query) =>
      query.state.data?.challenge.status === 'GENERATING' ? GENERATION_POLL_MS : false,
  });

  // Le détail sort de GENERATING : la liste doit l'apprendre tout de suite, sans attendre son
  // propre tour de polling — c'est elle qui porte le libellé d'état que l'administrateur lit.
  const previousDetailStatus = useRef<DailyChallengeStatus | null>(null);
  const detailStatus = detail?.challenge.status ?? null;

  useEffect(() => {
    if (previousDetailStatus.current === 'GENERATING' && detailStatus !== 'GENERATING') {
      queryClient.invalidateQueries({ queryKey: ['admin', 'daily-challenges'] });
    }
    previousDetailStatus.current = detailStatus;
  }, [detailStatus, queryClient]);

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

  const stopGenerationMutation = useMutation({
    mutationFn: (id: string) => adminApi.stopAdminDailyChallengeGeneration(id),
    onSuccess: () => {
      toast.success('Génération arrêtée — le brouillon est de nouveau modifiable.');
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
    // Tout autre échec est une vraie erreur, et doit se lire comme telle : ce message
    // servait jusqu'ici à toutes, et envoyait chercher des points bloquants inexistants
    // derrière une erreur 500. Rafraîchi dans les deux cas — le rapport affiché peut
    // dater, et l'état de l'édition après une panne n'est pas connu d'avance.
    onError: (e: unknown) => {
      const status = (e as { response?: { status?: number } }).response?.status;
      toast.error(
        status === 422
          ? "Publication refusée : corrige d'abord les points bloquants ci-dessous."
          : `Publication impossible : ${apiErrorMessage(e, 'erreur inattendue du serveur')}`,
      );
      invalidate();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelAdminDailyChallenge(id),
    onSuccess: () => {
      toast.success('Édition annulée.');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAdminDailyChallenge(id),
    onSuccess: (_data, id) => {
      toast.success('Édition supprimée.');
      // Le panneau de détail montrait peut-être l'édition qui vient de disparaître : le
      // laisser ouvert afficherait une 404 au prochain rafraîchissement.
      if (selectedId === id) setSelectedId(null);
      // Supprimer la dernière ligne d'une page laisserait l'écran sur une page vide.
      if (list?.content.length === 1 && page > 0) setPage((p) => p - 1);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Édition des questions ────────────────────────────────────────────────
  // Le serveur tient questionCount et maxPoints à jour : on se contente d'invalider.

  const addQuestionMutation = useMutation({
    mutationFn: (req: CreateDailyQuestionRequest) =>
      adminApi.addAdminDailyQuestion(selectedId!, req),
    onSuccess: () => {
      toast.success('Question ajoutée.');
      setQuestionDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, req }: { questionId: string; req: UpdateDailyQuestionRequest }) =>
      adminApi.updateAdminDailyQuestion(selectedId!, questionId, req),
    onSuccess: () => {
      toast.success('Question corrigée.');
      setQuestionDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) =>
      adminApi.deleteAdminDailyQuestion(selectedId!, questionId),
    onSuccess: () => {
      toast.success('Question supprimée.');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onDeleteQuestion = async (q: AdminDailyQuestionResponse) => {
    const ok = await confirmAsync({
      title: 'Supprimer cette question ?',
      message: `« ${q.text} » sera retirée et les suivantes renumérotées.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (ok) deleteQuestionMutation.mutate(q.id);
  };

  const onSaveQuestion = (draft: QuestionDraft) => {
    const payload = {
      text: draft.text.trim(),
      choices: draft.choices.map((c) => c.trim()),
      correctIndex: draft.correctIndex,
      explanation: draft.explanation.trim() || undefined,
    };
    if (draft.id) {
      updateQuestionMutation.mutate({ questionId: draft.id, req: payload });
    } else {
      addQuestionMutation.mutate(payload);
    }
  };

  const onStopGeneration = async (challenge: AdminDailyChallengeResponse) => {
    const ok = await confirmAsync({
      title: 'Arrêter la génération ?',
      message:
        `Le défi du ${formatDate(challenge.date)} redeviendra un brouillon, ` +
        'que tu pourras régénérer ou remplir à la main. La tentative ne sera pas décomptée.',
      confirmLabel: 'Arrêter',
    });
    if (ok) stopGenerationMutation.mutate(challenge.id);
  };

  /**
   * Supprime définitivement une édition.
   *
   * À distinguer de l'annulation, qui garde la ligne et sa trace : la suppression efface
   * l'édition et ses questions. Le serveur la refuse sur une édition publiée — les joueurs
   * l'ont peut-être déjà jouée — et le bouton n'y est donc pas proposé.
   */
  const onDeleteChallenge = async (challenge: AdminDailyChallengeResponse) => {
    const ok = await confirmAsync({
      title: 'Supprimer cette édition ?',
      message:
        `Le défi du ${formatDate(challenge.date)} et ses ${challenge.questionCount} question(s) ` +
        'seront effacés définitivement. Pour garder une trace, annule-la plutôt.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (ok) deleteChallengeMutation.mutate(challenge.id);
  };

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

  // Miroir de requireEditable côté serveur : une édition publique n'est plus modifiable,
  // les joueurs la voient déjà. Le serveur reste l'autorité — ceci ne fait que cacher des
  // boutons qui répondraient 409.
  const questionsEditable =
    !!detail && !PUBLIC_STATUSES.includes(detail.challenge.status);

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
                      {c.status === 'GENERATING' && (
                        <GenerationElapsed startedAt={c.generationStartedAt} />
                      )}
                      {c.generationError && c.status !== 'GENERATING' && (
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
                      {c.status === 'GENERATING' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); void onStopGeneration(c); }}
                          disabled={stopGenerationMutation.isPending}
                          title="Arrêter la génération — l’édition redevient un brouillon"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 10px', borderRadius: 6, fontSize: 12,
                            border: '1px solid var(--line)', background: 'transparent',
                            color: 'var(--bad)', cursor: 'pointer',
                          }}
                        >
                          <StopCircle size={13} /> Arrêter
                        </button>
                      )}
                      {CANCELLABLE_STATUSES.includes(c.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); void onCancel(c); }}
                          title="Abandonner l’édition — la ligne et sa trace sont conservées"
                          style={{
                            marginLeft: 6, padding: '5px 8px', borderRadius: 6,
                            border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer',
                          }}
                        >
                          <Ban size={13} />
                        </button>
                      )}
                      {/* Miroir de requireEditable côté serveur : une édition publique a pu
                          être jouée, l'effacer emporterait les tentatives des joueurs. */}
                      {!PUBLIC_STATUSES.includes(c.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); void onDeleteChallenge(c); }}
                          disabled={deleteChallengeMutation.isPending}
                          title="Supprimer définitivement l’édition et ses questions"
                          style={{
                            marginLeft: 6, padding: '5px 8px', borderRadius: 6,
                            border: '1px solid var(--line)', background: 'transparent',
                            color: 'var(--bad)', cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
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

          {detail.questions.map((q) =>
            questionDraft?.id === q.id ? (
              <QuestionForm
                key={q.id}
                draft={questionDraft}
                setDraft={setQuestionDraft}
                onSave={() => onSaveQuestion(questionDraft)}
                onCancel={() => setQuestionDraft(null)}
                isSaving={updateQuestionMutation.isPending}
              />
            ) : (
              <div key={q.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, flex: 1 }}>
                    {q.orderIndex + 1}. {q.text}
                  </div>
                  {questionsEditable && (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => setQuestionDraft(draftFromQuestion(q))}
                        title="Corriger"
                        style={iconButtonStyle}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteQuestion(q)}
                        disabled={deleteQuestionMutation.isPending}
                        title="Supprimer"
                        style={{ ...iconButtonStyle, color: 'var(--bad)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
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
            )
          )}

          {/* Saisie manuelle — le recours que l'interface promettait sans qu'aucun endpoint
              ne l'assure. Fermé dès que l'édition est publique : les joueurs la voient déjà. */}
          {questionsEditable && (
            questionDraft && !questionDraft.id ? (
              <QuestionForm
                draft={questionDraft}
                setDraft={setQuestionDraft}
                onSave={() => onSaveQuestion(questionDraft)}
                onCancel={() => setQuestionDraft(null)}
                isSaving={addQuestionMutation.isPending}
              />
            ) : (
              <button
                onClick={() => setQuestionDraft(emptyDraft())}
                style={{
                  marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                  background: 'transparent', color: 'var(--txt)',
                  border: '1px dashed var(--line)',
                }}
              >
                <Plus size={15} /> Ajouter une question
              </button>
            )
          )}
        </Card>
      )}
    </div>
  );
}
