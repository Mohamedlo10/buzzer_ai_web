import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Megaphone,
  ExternalLink,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Spinner } from '../components/loading/Spinner';
import {
  adminApi,
  confirmAsync,
  type AdminAdResponse,
  type AdminAdRequest,
  type AdminAdPlacement,
  type AdminPartnerResponse,
} from '@xalaat/core';

const PLACEMENT_LABELS: Record<AdminAdPlacement, string> = {
  HOME: 'Accueil',
  ROOMS: 'Salons',
  FRIENDS: 'Amis',
  PROFILE: 'Mon profil',
  RANKINGS: 'Classements',
  DAILY_HOME: 'Défi du Jour — accueil',
  DAILY_DONE: 'Défi du Jour — déjà joué',
  RESULT: 'Résultats de partie',
  GENERATION: 'Attente de génération',
  LOBBY: 'Salon d’attente',
  ROOM_DETAIL: 'Fiche d’un salon',
  PLAYER_PROFILE: 'Profil d’un joueur',
  HISTORY: 'Mes parties',
  BADGES: 'Mes badges',
  NOTIFICATIONS: 'Notifications',
};

/**
 * Emplacements groupés par famille.
 *
 * Quinze cases à cocher en vrac seraient illisibles ; regroupées, l'administrateur voit
 * d'un coup d'œil quelle partie du parcours il cible. Aucun écran de jeu n'y figure :
 * une publicité pendant une question, un décompte ou un buzz est une interruption.
 */
const PLACEMENT_GROUPS: { title: string; hint?: string; items: AdminAdPlacement[] }[] = [
  {
    title: 'Onglets principaux',
    hint: 'Les surfaces les plus vues.',
    items: ['HOME', 'ROOMS', 'FRIENDS', 'PROFILE', 'RANKINGS'],
  },
  {
    title: 'Défi du Jour',
    hint: '« Déjà joué » est le moment le plus disponible de la journée d’un joueur.',
    items: ['DAILY_HOME', 'DAILY_DONE'],
  },
  {
    title: 'Autour d’une partie',
    hint: 'Temps morts réels : attente de génération, salon avant lancement, résultats.',
    items: ['GENERATION', 'LOBBY', 'RESULT'],
  },
  {
    title: 'Consultation',
    hint: 'Écrans parcourus sans action engagée.',
    items: ['ROOM_DETAIL', 'PLAYER_PROFILE', 'HISTORY', 'BADGES', 'NOTIFICATIONS'],
  },
];

const EMPTY_FORM: AdminAdRequest = {
  title: '',
  targetUrl: '',
  placements: ['HOME'],
  partnerId: '',
  active: false,
  priority: 0,
  startDate: null,
  endDate: null,
};

/**
 * ISO-8601 → valeur d'un <input type="datetime-local"> ("YYYY-MM-DDTHH:mm", heure locale).
 * L'input ne comprend ni le suffixe Z ni les secondes.
 */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valeur d'un <input type="datetime-local"> → ISO-8601 UTC. Vide = pas de contrainte. */
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function AdvertisementsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<AdminAdRequest>(EMPTY_FORM);

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['adminAds'],
    queryFn: () => adminApi.getAdminAds(),
  });

  // Une campagne appartient toujours à un partenaire : la liste alimente le sélecteur.
  const { data: partnerPage } = useQuery({
    queryKey: ['adminPartners'],
    queryFn: () => adminApi.getAdminPartners(0, 100),
  });
  const partners = partnerPage?.content ?? [];

  const createMutation = useMutation({
    mutationFn: (req: AdminAdRequest) => adminApi.createAdminAd(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAds'] });
      toast.success('Publicité créée');
      setIsCreating(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: AdminAdRequest }) =>
      adminApi.updateAdminAd(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAds'] });
      toast.success('Publicité mise à jour');
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAdminAd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAds'] });
      toast.success('Publicité supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  function startEdit(ad: AdminAdResponse) {
    setIsCreating(false);
    setEditingId(ad.id);
    // Le PUT est complet : tout ce qui n'est pas relu ici est écrasé à l'enregistrement.
    // `active` et `priority` étaient codés en dur à false/0 — corriger un titre suffisait
    // à désactiver la campagne et à perdre sa priorité et ses dates.
    setForm({
      title: ad.title,
      imageUrl: ad.imageUrl ?? '',
      targetUrl: ad.targetUrl,
      placements: [...ad.placements],
      partnerId: ad.partnerId,
      active: ad.active,
      priority: ad.priority,
      startDate: ad.startDate,
      endDate: ad.endDate,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setForm(EMPTY_FORM);
  }

  function startCreate() {
    setEditingId(null);
    setIsCreating(true);
    setForm(EMPTY_FORM);
  }

  async function handleDelete(ad: AdminAdResponse) {
    const confirmed = await confirmAsync({
      title: 'Supprimer la publicité',
      message: `Supprimer « ${ad.title} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (confirmed) deleteMutation.mutate(ad.id);
  }

  function handleSave() {
    if (isCreating) {
      createMutation.mutate(form);
    } else if (editingId) {
      updateMutation.mutate({ id: editingId, req: form });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-bg pt-6 pb-4 px-4 border-b border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-3 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} color="var(--txt)" />
            </button>
            <div className="flex-1">
              <p className="text-txt font-bold text-xl font-display">Publicités</p>
              <p className="text-txt-60 text-xs">
                {/* Ne plus affirmer « désactivées » : le flag ADS_ENABLED est serveur et
                    peut être à true. Une page d'admin qui ment sur l'état est pire que muette. */}
                {ads.length} publicité{ads.length !== 1 ? 's' : ''} — diffusion soumise au flag serveur ADS_ENABLED
              </p>
            </div>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-host text-white text-sm font-semibold hover:bg-host/90 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Nouvelle pub
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-4 max-w-3xl w-full mx-auto">

        {/* Create form */}
        {isCreating && (
          <AdForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={cancelEdit}
            isSaving={isSaving}
            partners={partners}
            title="Nouvelle publicité"
          />
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner text="Chargement..." />
          </div>
        ) : ads.length === 0 && !isCreating ? (
          <Card className="flex flex-col items-center justify-center py-12 gap-3">
            <Megaphone size={32} color="rgba(255,255,255,0.25)" />
            <p className="text-txt-60 text-sm">Aucune publicité créée</p>
          </Card>
        ) : (
          ads.map((ad) =>
            editingId === ad.id ? (
              <AdForm
                key={ad.id}
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={cancelEdit}
                isSaving={isSaving}
                partners={partners}
                title="Modifier la publicité"
              />
            ) : (
              <AdRow
                key={ad.id}
                ad={ad}
                onEdit={() => startEdit(ad)}
                onDelete={() => handleDelete(ad)}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === ad.id}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface AdRowProps {
  ad: AdminAdResponse;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function AdRow({ ad, onEdit, onDelete, isDeleting }: AdRowProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-host/15 flex items-center justify-center shrink-0">
        <Megaphone size={18} color="var(--host)" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-txt font-semibold truncate">{ad.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {/* Sans cette pastille, rien ne distinguait une campagne diffusée d'un brouillon. */}
          <span
            className={
              ad.active
                ? 'text-xs px-2 py-0.5 rounded-full bg-good/15 text-good font-semibold'
                : 'text-xs px-2 py-0.5 rounded-full bg-surface-2 text-txt-40 font-semibold'
            }
          >
            {ad.active ? 'ACTIVE' : 'INACTIVE'}
          </span>
          {ad.placements.map((p) => (
            <span
              key={p}
              className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-txt-60 font-medium"
            >
              {PLACEMENT_LABELS[p]}
            </span>
          ))}
          <span className="text-xs text-txt-40">priorité {ad.priority}</span>
          <span className="text-xs text-txt-60">· {ad.partnerName}</span>
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noreferrer"
            className="text-txt-40 hover:text-txt transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 text-txt-60 hover:text-txt transition-colors cursor-pointer"
          title="Éditer"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-lg bg-buzz/15 hover:bg-buzz/20 text-buzz transition-colors cursor-pointer disabled:opacity-50"
          title="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Card>
  );
}

interface AdFormProps {
  form: AdminAdRequest;
  setForm: React.Dispatch<React.SetStateAction<AdminAdRequest>>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  partners: AdminPartnerResponse[];
  title: string;
}

function AdForm({ form, setForm, onSave, onCancel, isSaving, partners, title }: AdFormProps) {
  function field(key: keyof AdminAdRequest) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  const isValid =
    form.title.trim() &&
    form.targetUrl.trim() &&
    form.placements.length > 0 &&
    form.partnerId;

  function togglePlacement(p: AdminAdPlacement) {
    setForm((f) => ({
      ...f,
      placements: f.placements.includes(p)
        ? f.placements.filter((x) => x !== p)
        : [...f.placements, p],
    }));
  }

  return (
    <Card className="space-y-4">
      <p className="text-txt font-semibold">{title}</p>

      <div className="space-y-3">
        <div>
          <label className="block text-txt-60 text-xs mb-1">Titre *</label>
          <input
            value={form.title}
            onChange={field('title')}
            placeholder="Ex. Xalaat Pro"
            className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50"
          />
        </div>

        {/* Les visuels ne sont plus portés par la campagne mais par le partenaire : c'est lui
            qui détient jusqu'à trois photos et une vidéo, gérées depuis la page Partenaires. */}
        <div>
          <label className="block text-txt-60 text-xs mb-1">Partenaire *</label>
          <select
            value={form.partnerId}
            onChange={field('partnerId')}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50 cursor-pointer"
          >
            <option value="">— Choisir un partenaire —</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.active ? '' : ' (inactif)'}
              </option>
            ))}
          </select>
          <p className="text-txt-40 text-xs mt-1">
            Les photos et la vidéo de la carte viennent de la fiche du partenaire.
          </p>
        </div>

        <div>
          <label className="block text-txt-60 text-xs mb-1">URL cible *</label>
          <input
            value={form.targetUrl}
            onChange={field('targetUrl')}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50"
          />
        </div>

        <div>
          <label className="block text-txt-60 text-xs mb-2">
            Emplacements * — une même campagne peut viser plusieurs écrans
          </label>
          <div className="space-y-3">
            {PLACEMENT_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-txt-40 text-[11px] uppercase tracking-wide mb-1">
                  {group.title}
                </p>
                {group.hint && (
                  <p className="text-txt-40 text-[11px] mb-1.5">{group.hint}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((p) => {
                    const on = form.placements.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlacement(p)}
                        className={
                          on
                            ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-host text-white cursor-pointer'
                            : 'px-3 py-1.5 rounded-full text-xs bg-surface-2 text-txt-60 hover:text-txt cursor-pointer'
                        }
                      >
                        {PLACEMENT_LABELS[p]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {form.placements.length === 0 && (
            <p className="text-warn text-xs mt-2">Sélectionnez au moins un emplacement.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-txt-60 text-xs mb-1">Priorité</label>
            <input
              type="number"
              value={form.priority ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value, 10) || 0 }))}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active ?? false}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-host"
              />
              <span className="text-txt text-sm">Active</span>
            </label>
          </div>
        </div>

        {/* Fenêtre de diffusion — filtrée côté serveur par findActiveForPlacement.
            Ces deux champs existaient en base et dans AdRequest depuis l'origine,
            mais n'avaient jamais été exposés : une campagne datée était impossible. */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-txt-60 text-xs mb-1">Début (vide = immédiat)</label>
            <input
              type="datetime-local"
              value={toLocalInput(form.startDate)}
              onChange={(e) => setForm((f) => ({ ...f, startDate: fromLocalInput(e.target.value) }))}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50"
            />
          </div>
          <div>
            <label className="block text-txt-60 text-xs mb-1">Fin (vide = sans limite)</label>
            <input
              type="datetime-local"
              value={toLocalInput(form.endDate)}
              onChange={(e) => setForm((f) => ({ ...f, endDate: fromLocalInput(e.target.value) }))}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={!isValid || isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-host text-white text-sm font-semibold hover:bg-host/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save size={14} />
          {isSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-surface-2 text-txt-60 text-sm hover:text-txt transition-colors cursor-pointer"
        >
          <X size={14} className="inline mr-1" />
          Annuler
        </button>
      </div>
    </Card>
  );
}
