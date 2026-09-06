import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Handshake,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Upload,
  Link2,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Spinner } from '../components/loading/Spinner';
import {
  adminApi,
  confirmAsync,
  type AdminPartnerResponse,
  type AdminPartnerRequest,
  type AdminPartnerMediaResponse,
  type MediaKind,
} from '@xalaat/core';

/**
 * Gestion des partenaires.
 *
 * Un partenaire porte l'identité — nom, logo, réseaux sociaux, jusqu'à trois photos et une
 * vidéo — et les campagnes de la page Publicités s'y rattachent. Les deux modes de saisie des
 * médias, téléversement et URL externe, coexistent dans le même formulaire : la contrainte de
 * base garantit qu'un média n'a jamais deux sources.
 */

const EMPTY_FORM: AdminPartnerRequest = {
  name: '',
  tagline: '',
  description: '',
  logoKey: null,
  logoUrl: '',
  websiteUrl: '',
  phone: '',
  whatsapp: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  city: '',
  active: false,
};

const inputClass =
  'w-full px-3 py-2 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50';

export function PartnersPage() {
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<AdminPartnerRequest>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: list, isLoading } = useQuery({
    queryKey: ['adminPartners'],
    queryFn: () => adminApi.getAdminPartners(0, 100),
  });

  // Les médias ne sont chargés que pour la fiche ouverte : les mettre dans la liste
  // rouvrirait le N+1 que le service prend soin d'éviter.
  const { data: detail } = useQuery({
    queryKey: ['adminPartner', expandedId],
    queryFn: () => adminApi.getAdminPartner(expandedId!),
    enabled: !!expandedId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminPartners'] });
    if (expandedId) {
      queryClient.invalidateQueries({ queryKey: ['adminPartner', expandedId] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (req: AdminPartnerRequest) => adminApi.createAdminPartner(req),
    onSuccess: (created) => {
      toast.success('Partenaire créé');
      setIsCreating(false);
      setForm(EMPTY_FORM);
      setExpandedId(created.id);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: AdminPartnerRequest }) =>
      adminApi.updateAdminPartner(id, req),
    onSuccess: () => {
      toast.success('Partenaire mis à jour');
      setEditingId(null);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAdminPartner(id),
    onSuccess: () => {
      toast.success('Partenaire supprimé');
      setExpandedId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(p: AdminPartnerResponse) {
    setIsCreating(false);
    setEditingId(p.id);
    // Relecture fidèle, logoKey comprise : un PUT partiel effacerait le logo téléversé.
    setForm({
      name: p.name,
      tagline: p.tagline ?? '',
      description: p.description ?? '',
      logoKey: p.logoKey,
      logoUrl: p.logoKey ? '' : (p.logoUrl ?? ''),
      websiteUrl: p.websiteUrl ?? '',
      phone: p.phone ?? '',
      whatsapp: p.whatsapp ?? '',
      facebookUrl: p.facebookUrl ?? '',
      instagramUrl: p.instagramUrl ?? '',
      tiktokUrl: p.tiktokUrl ?? '',
      city: p.city ?? '',
      active: p.active,
    });
  }

  async function handleDelete(p: AdminPartnerResponse) {
    const ok = await confirmAsync({
      title: 'Supprimer ce partenaire',
      message: `« ${p.name} », ses médias et ses campagnes seront supprimés. Irréversible.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (ok) deleteMutation.mutate(p.id);
  }

  function handleSave() {
    if (isCreating) createMutation.mutate(form);
    else if (editingId) updateMutation.mutate({ id: editingId, req: form });
  }

  const partners = list?.content ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <Spinner />;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="bg-bg pt-6 pb-4 px-4 border-b border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Handshake size={20} color="var(--txt)" />
            <div>
              <p className="text-txt font-bold text-xl font-display">Partenaires</p>
              <p className="text-txt-60 text-xs">
                {partners.length} partenaire{partners.length !== 1 ? 's' : ''} — seuls les actifs
                apparaissent dans l'annuaire de l'application
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setIsCreating(true);
              setForm(EMPTY_FORM);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-host text-white text-sm font-semibold hover:bg-host/90 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Nouveau partenaire
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-4 max-w-4xl w-full mx-auto">
        {isCreating && (
          <PartnerForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={() => {
              setIsCreating(false);
              setForm(EMPTY_FORM);
            }}
            isSaving={isSaving}
            title="Nouveau partenaire"
          />
        )}

        {partners.length === 0 && !isCreating ? (
          <Card className="flex flex-col items-center justify-center py-12 gap-3">
            <Handshake size={32} color="rgba(255,255,255,0.25)" />
            <p className="text-txt-60 text-sm">Aucun partenaire</p>
          </Card>
        ) : (
          partners.map((p) =>
            editingId === p.id ? (
              <PartnerForm
                key={p.id}
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
                isSaving={isSaving}
                title="Modifier le partenaire"
              />
            ) : (
              <PartnerRow
                key={p.id}
                partner={p}
                expanded={expandedId === p.id}
                detail={expandedId === p.id ? detail : undefined}
                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                onEdit={() => startEdit(p)}
                onDelete={() => handleDelete(p)}
                onMediaChanged={invalidate}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

// ─── Ligne de partenaire ─────────────────────────────────────────────────────

function PartnerRow({
  partner,
  expanded,
  detail,
  onToggle,
  onEdit,
  onDelete,
  onMediaChanged,
}: {
  partner: AdminPartnerResponse;
  expanded: boolean;
  detail?: AdminPartnerResponse;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMediaChanged: () => void;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-4">
        {partner.logoUrl ? (
          <img
            src={partner.logoUrl}
            alt=""
            className="w-10 h-10 rounded-xl object-cover shrink-0 bg-surface-2"
            // Une URL externe collée par l'admin peut casser : ne pas laisser un carré vide.
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-host/15 flex items-center justify-center shrink-0">
            <Handshake size={18} color="var(--host)" />
          </div>
        )}

        <button onClick={onToggle} className="flex-1 min-w-0 text-left cursor-pointer">
          <p className="text-txt font-semibold truncate">{partner.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className={
                partner.active
                  ? 'text-xs px-2 py-0.5 rounded-full bg-good/15 text-good font-semibold'
                  : 'text-xs px-2 py-0.5 rounded-full bg-surface-2 text-txt-40 font-semibold'
              }
            >
              {partner.active ? 'ACTIF' : 'INACTIF'}
            </span>
            {partner.city && <span className="text-xs text-txt-40">{partner.city}</span>}
            {partner.tagline && (
              <span className="text-xs text-txt-60 truncate">{partner.tagline}</span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-surface-2 text-txt-60 hover:text-txt transition-colors cursor-pointer"
            title="Éditer"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-buzz/15 text-buzz transition-colors cursor-pointer"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <MediaManager
          partnerId={partner.id}
          media={detail?.media ?? []}
          onChanged={onMediaChanged}
        />
      )}
    </Card>
  );
}

// ─── Médias ──────────────────────────────────────────────────────────────────

/**
 * Gestion des médias d'un partenaire, avec les deux modes de saisie côte à côte.
 *
 * L'administration est sur DOM : un `<input type="file">` suffit, aucune dépendance native
 * n'est nécessaire. Le téléversement passe d'abord par POST /api/admin/media, qui rend une
 * clé de stockage ; c'est cette clé qu'on rattache ensuite au partenaire.
 */
function MediaManager({
  partnerId,
  media,
  onChanged,
}: {
  partnerId: string;
  media: AdminPartnerMediaResponse[];
  onChanged: () => void;
}) {
  const [externalUrl, setExternalUrl] = useState('');
  const [kind, setKind] = useState<MediaKind>('IMAGE');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const images = media.filter((m) => m.kind === 'IMAGE');
  const video = media.find((m) => m.kind === 'VIDEO');

  const attachMutation = useMutation({
    mutationFn: (req: { kind: MediaKind; storageKey?: string; externalUrl?: string }) =>
      adminApi.addAdminPartnerMedia(partnerId, req),
    onSuccess: () => {
      toast.success('Média ajouté');
      setExternalUrl('');
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (mediaId: string) => adminApi.deleteAdminPartnerMedia(partnerId, mediaId),
    onSuccess: () => {
      toast.success('Média retiré');
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      // Deux appels et non un : le téléversement est indépendant du rattachement, ce qui
      // permet de réutiliser le même endpoint pour le logo comme pour un média de carrousel.
      const uploaded = await adminApi.uploadAdminMedia(file, kind);
      await attachMutation.mutateAsync({ kind, storageKey: uploaded.storageKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Téléversement impossible');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const slotsFull = kind === 'IMAGE' ? images.length >= 3 : !!video;

  return (
    <div className="border-t border-line pt-3 space-y-3">
      <p className="text-txt-60 text-xs">
        {images.length}/3 photo{images.length !== 1 ? 's' : ''} · {video ? '1' : '0'}/1 vidéo —
        sur la carte, les photos défilent et la vidéo est le dernier volet
      </p>

      {media.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {media.map((m) => (
            <div key={m.id} className="relative group">
              {m.kind === 'IMAGE' ? (
                <img
                  src={m.url}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover bg-surface-2"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-surface-2 flex items-center justify-center">
                  <Video size={20} color="var(--txt-60)" />
                </div>
              )}
              <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center bg-black/60 text-white rounded-b-lg py-0.5">
                {m.storageKey ? 'fichier' : 'lien'}
              </span>
              <button
                onClick={() => removeMutation.mutate(m.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-buzz text-white flex items-center justify-center cursor-pointer"
                title="Retirer"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as MediaKind)}
          className={`${inputClass} w-auto cursor-pointer`}
        >
          <option value="IMAGE">Photo</option>
          <option value="VIDEO">Vidéo</option>
        </select>

        {/* Mode 1 : téléverser un fichier sur le serveur. */}
        <input
          ref={fileInputRef}
          type="file"
          accept={kind === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'video/mp4'}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || slotsFull}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 text-txt text-sm cursor-pointer disabled:opacity-40"
        >
          <Upload size={14} />
          {uploading ? 'Envoi…' : 'Téléverser'}
        </button>

        <span className="text-txt-40 text-xs">ou</span>

        {/* Mode 2 : coller une URL externe. */}
        <input
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://… (lien externe)"
          className={`${inputClass} flex-1 min-w-[200px]`}
        />
        <button
          onClick={() => attachMutation.mutate({ kind, externalUrl: externalUrl.trim() })}
          disabled={!externalUrl.trim() || slotsFull || attachMutation.isPending}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 text-txt text-sm cursor-pointer disabled:opacity-40"
        >
          <Link2 size={14} />
          Rattacher
        </button>
      </div>

      {slotsFull && (
        <p className="text-warn text-xs">
          {kind === 'IMAGE'
            ? 'Trois photos au maximum : retirez-en une avant d’en ajouter.'
            : 'Une seule vidéo par partenaire : retirez-la avant d’en ajouter une autre.'}
        </p>
      )}
    </div>
  );
}

// ─── Formulaire ──────────────────────────────────────────────────────────────

function PartnerForm({
  form,
  setForm,
  onSave,
  onCancel,
  isSaving,
  title,
}: {
  form: AdminPartnerRequest;
  setForm: React.Dispatch<React.SetStateAction<AdminPartnerRequest>>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  title: string;
}) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  function field(key: keyof AdminPartnerRequest) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const uploaded = await adminApi.uploadAdminMedia(file, 'IMAGE');
      // Les deux sources s'excluent : poser la clé efface l'URL externe.
      setForm((f) => ({ ...f, logoKey: uploaded.storageKey, logoUrl: '' }));
      toast.success('Logo téléversé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Téléversement impossible');
    } finally {
      setUploadingLogo(false);
    }
  }

  const valid = form.name.trim().length > 0;

  return (
    <Card className="space-y-4">
      <p className="text-txt font-semibold">{title}</p>

      <div className="space-y-3">
        <div>
          <label className="block text-txt-60 text-xs mb-1">Nom *</label>
          <input value={form.name} onChange={field('name')} className={inputClass} />
        </div>

        <div>
          <label className="block text-txt-60 text-xs mb-1">Accroche</label>
          <input
            value={form.tagline ?? ''}
            onChange={field('tagline')}
            placeholder="Le pain chaud depuis 1998"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-txt-60 text-xs mb-1">Description</label>
          <textarea
            value={form.description ?? ''}
            onChange={field('description')}
            rows={3}
            className={`${inputClass} resize-y font-sans`}
          />
        </div>

        {/* Logo : téléversement OU lien, jamais les deux — le serveur refuse. */}
        <div>
          <label className="block text-txt-60 text-xs mb-1">Logo</label>
          {form.logoKey ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-txt text-sm px-3 py-2 rounded-xl bg-surface-2">
                <ImageIcon size={14} /> Fichier téléversé
              </span>
              <button
                onClick={() => setForm((f) => ({ ...f, logoKey: null }))}
                className="px-3 py-2 rounded-xl bg-surface-2 text-txt-60 text-sm cursor-pointer"
              >
                Retirer
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center flex-wrap">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                }}
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 text-txt text-sm cursor-pointer disabled:opacity-40"
              >
                <Upload size={14} />
                {uploadingLogo ? 'Envoi…' : 'Téléverser'}
              </button>
              <span className="text-txt-40 text-xs">ou</span>
              <input
                value={form.logoUrl ?? ''}
                onChange={field('logoUrl')}
                placeholder="https://… (lien externe)"
                className={`${inputClass} flex-1 min-w-[200px]`}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-txt-60 text-xs mb-1">Site web</label>
            <input
              value={form.websiteUrl ?? ''}
              onChange={field('websiteUrl')}
              placeholder="https://…"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-txt-60 text-xs mb-1">Ville</label>
            <input value={form.city ?? ''} onChange={field('city')} className={inputClass} />
          </div>
          <div>
            <label className="block text-txt-60 text-xs mb-1">Téléphone</label>
            <input
              value={form.phone ?? ''}
              onChange={field('phone')}
              placeholder="+221…"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-txt-60 text-xs mb-1">WhatsApp</label>
            <input
              value={form.whatsapp ?? ''}
              onChange={field('whatsapp')}
              placeholder="+221…"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-txt-60 text-xs mb-1">Facebook</label>
            <input
              value={form.facebookUrl ?? ''}
              onChange={field('facebookUrl')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-txt-60 text-xs mb-1">Instagram</label>
            <input
              value={form.instagramUrl ?? ''}
              onChange={field('instagramUrl')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-txt-60 text-xs mb-1">TikTok</label>
            <input
              value={form.tiktokUrl ?? ''}
              onChange={field('tiktokUrl')}
              className={inputClass}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-host"
              />
              <span className="text-txt text-sm">Visible dans l'annuaire</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={!valid || isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-host text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
        >
          <Save size={14} />
          {isSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-surface-2 text-txt-60 text-sm cursor-pointer"
        >
          <X size={14} className="inline mr-1" />
          Annuler
        </button>
      </div>
    </Card>
  );
}
