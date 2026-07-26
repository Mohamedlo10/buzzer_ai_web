import React from 'react';
import { XalaatMark } from './XalaatMark';
import { Avatar } from './Avatar';

export function AppTopBar({
  t,
  type,
  title = 'Xalaat',
  tag = 'QUIZ',
  avatarName = 'Momo',
  avatarHue = 30,
  back = false,
}: {
  t?: any;
  type?: any;
  title?: string;
  tag?: string;
  avatarName?: string;
  avatarHue?: number;
  back?: boolean;
}) {
  const bgSurface = t?.surface || 'var(--color-surface)';
  const borderLine = t?.line || 'var(--color-line)';
  const bgPrimary = t?.primary || 'var(--color-primary)';
  const primaryInk = t?.primaryInk || 'var(--color-primary-ink)';
  const accent = t?.accent || 'var(--color-accent)';
  const fontDisplay = type?.display || 'var(--font-display)';
  const displayWeight = type?.displayWeight ?? 'var(--font-display-weight)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '52px 20px 14px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {back && (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-pill)',
              background: bgSurface,
              border: `1px solid ${borderLine}`,
              display: 'grid',
              placeItems: 'center',
              fontSize: 15,
              marginRight: 2,
            }}
          >
            ←
          </div>
        )}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: bgPrimary,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <XalaatMark size={20} color={primaryInk} accent={accent} />
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div
            style={{
              fontFamily: fontDisplay,
              fontWeight: displayWeight,
              fontSize: 16,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: bgPrimary,
              fontWeight: 700,
            }}
          >
            {tag}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-pill)',
            background: bgSurface,
            border: `1px solid ${borderLine}`,
            display: 'grid',
            placeItems: 'center',
            fontSize: 13,
          }}
        >
          ☀️
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-pill)',
            background: bgSurface,
            border: `1px solid ${borderLine}`,
            display: 'grid',
            placeItems: 'center',
            fontSize: 13,
          }}
        >
          🔔
        </div>
        <Avatar name={avatarName} hue={avatarHue} size={34} ring={accent} />
      </div>
    </div>
  );
}
