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
} from '@xalaat/core';

const PLACEMENT_LABELS: Record<AdminAdPlacement, string> = {
  HOME: 'Accueil',
  RESULT: 'Résultats',
  GENERATION: 'Génération',
  PROFILE: 'Profil',
};

const PLACEMENT_OPTIONS: AdminAdPlacement[] = ['HOME', 'RESULT', 'GENERATION', 'PROFILE'];

const EMPTY_FORM: AdminAdRequest = {
  title: '',
  imageUrl: '',
  targetUrl: '',
  placement: 'HOME',
  active: false,
  priority: 0,
};

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
    setForm({
      title: ad.title,
      imageUrl: ad.imageUrl ?? '',
      targetUrl: ad.targetUrl,
      placement: ad.placement,
      active: false,
      priority: 0,
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
                {ads.length} publicité{ads.length !== 1 ? 's' : ''} — désactivées globalement (ADS_ENABLED=false)
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
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-txt-60 font-medium">
            {PLACEMENT_LABELS[ad.placement]}
          </span>
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
  title: string;
}

function AdForm({ form, setForm, onSave, onCancel, isSaving, title }: AdFormProps) {
  function field(key: keyof AdminAdRequest) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  const isValid = form.title.trim() && form.targetUrl.trim() && form.placement;

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

        <div>
          <label className="block text-txt-60 text-xs mb-1">URL de l'image</label>
          <input
            value={form.imageUrl ?? ''}
            onChange={field('imageUrl')}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50"
          />
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
          <label className="block text-txt-60 text-xs mb-1">Emplacement *</label>
          <select
            value={form.placement}
            onChange={field('placement')}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50 cursor-pointer"
          >
            {PLACEMENT_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {PLACEMENT_LABELS[p]}
              </option>
            ))}
          </select>
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
