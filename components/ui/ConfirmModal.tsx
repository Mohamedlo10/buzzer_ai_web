'use client';

import type { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmColor = '#00D397',
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9,6,28,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 340,
          borderRadius: 24,
          background: '#342D5B',
          border: '1px solid #4E4676',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Title */}
        <div
          style={{
            padding: '22px 22px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            borderBottom: '1px solid #3E3666',
          }}
        >
          {icon && (
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: `${confirmColor}18`,
                border: `1px solid ${confirmColor}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              {icon}
            </div>
          )}
          <p
            style={{
              color: '#E8E8F0',
              fontWeight: 700,
              fontSize: 17,
              margin: 0,
              letterSpacing: 0.3,
            }}
          >
            {title}
          </p>
        </div>

        {/* Message */}
        <div style={{ padding: '16px 22px 20px' }}>
          <p
            style={{
              color: '#E8E8F080',
              fontSize: 14,
              lineHeight: 1.55,
              margin: 0,
              textAlign: 'center',
            }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '0 18px 18px',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '13px 0',
              borderRadius: 14,
              background: '#3E3666',
              border: '1px solid #4E4676',
              color: '#e8e8f0d2',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '13px 0',
              borderRadius: 14,
              background: `${confirmColor}18`,
              border: `1px solid ${confirmColor}60`,
              color: confirmColor,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
