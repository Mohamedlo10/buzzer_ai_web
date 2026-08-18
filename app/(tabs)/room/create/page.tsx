'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { PatternLozenge } from '~/components/shared/PatternLozenge';
import * as roomsApi from '~/lib/api/rooms';

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(250);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Le nom du salon est requis');
      return;
    }

    if (trimmedName.length < 3) {
      setError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const room = await roomsApi.createRoom({
        name: trimmedName,
        description: description.trim() || undefined,
        maxPlayers,
      });
      router.replace(`/room/${room.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erreur lors de la création';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeScreen className="bg-bg min-h-[100dvh] relative overflow-hidden pb-16 flex flex-col">
      {/* Background pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <PatternLozenge color="var(--color-primary)" opacity={0.05} size={26} />
      </div>

      {/* Top bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-line)',
        }}
      >
        <button
          onClick={() => router.back()}
          type="button"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-line)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 16,
            cursor: 'pointer',
            color: 'var(--color-ink)',
          }}
        >
          ←
        </button>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 19,
              letterSpacing: '-0.015em',
            }}
          >
            Nouveau salon
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>Crée un espace pour tes parties</div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '20px 20px 24px',
        }}
        className="overflow-y-auto sm:pb-16 pb-44"
      >
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--card-radius)',
            border: '1px solid var(--color-line)',
            padding: 22,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(184, 70, 42, 0.12)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 22,
              margin: '0 auto 22px',
            }}
          >
            📁
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', display: 'block', marginBottom: 8 }}>
            Nom du salon *
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Ex : Soirée quiz, Les champions…"
            style={{
              width: '100%',
              padding: '13px 14px',
              borderRadius: 12,
              border: '1px solid var(--color-line)',
              background: 'var(--color-bg)',
              color: 'var(--color-ink)',
              fontSize: 14,
              fontFamily: 'inherit',
              marginBottom: 20,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            maxLength={50}
            autoFocus
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>
              Nombre maximum de joueurs
            </label>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(184, 70, 42, 0.12)',
                color: 'var(--color-primary)',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              👥 {maxPlayers}
            </span>
          </div>

          <input
            type="range"
            min={2}
            max={250}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)] mb-1 cursor-pointer"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-ink-soft)', marginBottom: 22 }}>
            <span>2</span>
            <span>250</span>
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', display: 'block', marginBottom: 8 }}>
            Description (optionnel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris ton salon…"
            rows={3}
            style={{
              width: '100%',
              padding: '13px 14px',
              borderRadius: 12,
              border: '1px solid var(--color-line)',
              background: 'var(--color-bg)',
              color: 'var(--color-ink)',
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            maxLength={200}
          />
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 12,
              background: 'rgba(209, 74, 46, 0.12)',
              border: '1px solid rgba(209, 74, 46, 0.3)',
              color: 'var(--color-primary)',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={isCreating}
          type="button"
          style={{
            width: '100%',
            padding: '17px 20px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-ink)',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 14px 30px -12px rgba(184, 70, 42, 0.4)',
          }}
        >
          {isCreating ? <Spinner text="Création…" /> : 'Créer le salon'}
        </button>
      </div>
    </SafeScreen>
  );
}
