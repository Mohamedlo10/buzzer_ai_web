import React from 'react';

export function BottomTabBar({
  t,
  active = 'accueil',
}: {
  t?: any;
  active?: string;
}) {
  const bgSurface = t?.surface || 'var(--color-surface)';
  const borderLine = t?.line || 'var(--color-line)';
  const primaryColor = t?.primary || 'var(--color-primary)';
  const inkSoftColor = t?.inkSoft || 'var(--color-ink-soft)';

  const tabs = [
    { k: 'multijoueur', ic: '▦', l: 'Multijoueur' },
    { k: 'solo', ic: '⚡', l: 'Solo' },
    { k: 'classement', ic: '★', l: 'Classement' },
    { k: 'amis', ic: '◯', l: 'Amis' },
    { k: 'profil', ic: '●', l: 'Profil' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 12px 22px',
        background: bgSurface,
        borderTop: `1px solid ${borderLine}`,
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.k}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: tab.k === active ? primaryColor : inkSoftColor,
            fontSize: 9.5,
            fontWeight: 600,
          }}
        >
          <div style={{ fontSize: 17 }}>{tab.ic}</div>
          {tab.l}
        </div>
      ))}
    </div>
  );
}
