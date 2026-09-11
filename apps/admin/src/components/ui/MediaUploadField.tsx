import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, Video, X, Check } from 'lucide-react';
import { adminApi, type MediaKind } from '@xalaat/core';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MediaUploadFieldProps {
  kind: MediaKind;
  /** URL courante du média : celle du bucket après téléversement, ou un lien collé. */
  url?: string | null;
  /** Appelé à chaque changement d'URL — frappe dans le champ, ou téléversement réussi. */
  onUrlChange: (url: string) => void;
  /**
   * Appelé quand l'URL est *validée* : téléversement terminé, ou lien confirmé par le bouton
   * ou la touche Entrée. Absent, l'URL n'a pas de moment de validation propre — c'est le cas
   * du logo, enregistré avec le reste du formulaire.
   */
  onCommit?: (url: string) => void;
  /** Retire le média retenu. */
  onClear: () => void;
  /** Désactive l'ensemble du champ (ex. pendant l'enregistrement du formulaire parent). */
  disabled?: boolean;
  /**
   * Désactive le bouton « Téléverser » — typiquement quand l'emplacement est plein.
   * Le champ URL reste disponible.
   */
  uploadDisabled?: boolean;
  uploadDisabledReason?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

// ─── Composant ───────────────────────────────────────────────────────────────

/**
 * Champ de saisie de média à double mode : téléversement de fichier ou lien collé.
 *
 * Les deux modes produisent la même chose — une URL — et le parent n'a qu'elle à conserver.
 * Le téléversement dépose le fichier dans le bucket Supabase et l'URL rendue par le serveur
 * est celle qui sera persistée puis affichée, sans recomposition ni résolution nulle part.
 *
 * Responsabilités :
 *   - Appeler `adminApi.uploadAdminMedia` et remonter l'URL obtenue.
 *   - Afficher l'état « Téléversement… » (une vidéo peut prendre plusieurs dizaines de
 *     secondes côté serveur, entre l'envoi et la recompression).
 *   - Afficher la taille originale et la taille après compression.
 *   - Afficher un aperçu, avec repli textuel si l'image est cassée.
 *   - Remonter les erreurs serveur par `toast.error` avec le message d'origine :
 *     MEDIA_UNSUPPORTED_FORMAT, MEDIA_TOO_LARGE, MEDIA_KIND_MISMATCH,
 *     MEDIA_STORAGE_NOT_CONFIGURED.
 *
 * Ce composant ne rattache PAS le média à une entité : c'est au parent de le faire, dans
 * `onCommit` (ex. `MediaManager` appelle `addAdminPartnerMedia`).
 */
export function MediaUploadField({
  kind,
  url,
  onUrlChange,
  onCommit,
  onClear,
  disabled = false,
  uploadDisabled = false,
  uploadDisabledReason,
}: MediaUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [originalBytes, setOriginalBytes] = useState<number | null>(null);
  const [compressedBytes, setCompressedBytes] = useState<number | null>(null);
  const [imgBroken, setImgBroken] = useState(false);

  const accept = kind === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'video/mp4';
  const isDisabled = disabled || uploading;
  const current = url?.trim() ?? '';

  async function handleFile(file: File) {
    setOriginalBytes(file.size);
    setCompressedBytes(null);
    setImgBroken(false);
    setUploading(true);
    try {
      const res = await adminApi.uploadAdminMedia(file, kind);
      setCompressedBytes(res.sizeBytes);
      // L'URL du bucket est la valeur définitive : rien d'autre n'est conservé, et c'est
      // exactement celle-ci qu'on réaffichera après rechargement.
      onUrlChange(res.url);
      onCommit?.(res.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Téléversement impossible');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function commit() {
    if (current) onCommit?.(current);
  }

  return (
    <div className="flex flex-col gap-2.5">

      {/* ── Ligne de saisie ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={isDisabled || uploadDisabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled || uploadDisabled}
          title={uploadDisabledReason}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 text-txt text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Upload size={14} />
          {uploading ? 'Téléversement…' : 'Téléverser'}
        </button>

        <span className="text-txt-40 text-xs">ou</span>

        <input
          type="url"
          value={url ?? ''}
          onChange={(e) => {
            setImgBroken(false);
            onUrlChange(e.target.value);
          }}
          // Entrée valide le lien plutôt que d'envoyer le formulaire parent : sans cela,
          // coller une URL et appuyer sur Entrée enregistrerait le partenaire par surprise.
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onCommit) {
              e.preventDefault();
              commit();
            }
          }}
          disabled={isDisabled}
          placeholder="https://… (lien externe)"
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-surface border border-line text-txt text-sm focus:outline-none focus:border-host/50"
        />

        {/* Le lien collé n'est rattaché que sur une action explicite. Le faire à la frappe
            déclencherait un appel serveur par caractère saisi. */}
        {onCommit && (
          <button
            type="button"
            onClick={commit}
            disabled={isDisabled || !current}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-host text-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={13} />
            Ajouter
          </button>
        )}

        {current && (
          <button
            type="button"
            onClick={() => {
              setOriginalBytes(null);
              setCompressedBytes(null);
              setImgBroken(false);
              onClear();
            }}
            disabled={isDisabled}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-2 text-txt-60 text-sm cursor-pointer disabled:opacity-40"
          >
            <X size={13} />
            Retirer
          </button>
        )}
      </div>

      {/* ── Indicateur de progression / tailles ────────────────────── */}
      {uploading && (
        <p className="text-txt-60 text-xs m-0">
          {originalBytes !== null && `Envoi de ${formatBytes(originalBytes)} — `}
          recompression côté serveur, patientez…
        </p>
      )}
      {!uploading && originalBytes !== null && compressedBytes !== null && (
        <p className="text-xs m-0">
          <span className="text-good">
            {formatBytes(originalBytes)} → {formatBytes(compressedBytes)}
          </span>{' '}
          <span className="text-txt-60">
            (−{Math.round((1 - compressedBytes / originalBytes) * 100)} % après compression)
          </span>
        </p>
      )}

      {/* ── Aperçu ──────────────────────────────────────────────────── */}
      {current && kind === 'IMAGE' && (
        imgBroken ? (
          <div className="w-20 h-20 rounded-xl bg-surface-2 flex items-center justify-center text-txt-40 text-[11px] text-center p-1">
            Aperçu<br />indisponible
          </div>
        ) : (
          <img
            src={current}
            alt="Aperçu"
            className="w-20 h-20 rounded-xl object-cover bg-surface-2 block"
            onError={() => setImgBroken(true)}
          />
        )
      )}
      {current && kind === 'VIDEO' && (
        <div className="flex items-center gap-1.5 text-txt-60 text-xs">
          <Video size={14} />
          <span>Vidéo retenue</span>
        </div>
      )}
    </div>
  );
}
