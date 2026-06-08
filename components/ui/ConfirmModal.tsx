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
      className="fixed inset-0 bg-scrim flex items-center justify-center z-[100] p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[340px] rounded-3xl bg-surface border border-line overflow-hidden shadow-2xl animate-[pop_.3s_ease-out_both]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-[22px] pt-[22px] pb-4 flex flex-col items-center text-center border-b border-line">
          {icon && (
            <div
              className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center mb-3.5"
              style={{
                background: `${confirmColor}18`,
                border: `1px solid ${confirmColor}30`,
              }}
            >
              {icon}
            </div>
          )}
          <p className="text-txt font-bold text-[17px] tracking-wide">{title}</p>
        </div>

        <div className="px-[22px] py-4 pb-5">
          <p className="text-txt-60 text-sm leading-relaxed text-center">{message}</p>
        </div>

        <div className="flex gap-2.5 px-[18px] pb-[18px]">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-[14px] bg-surface-2 border border-line text-txt-60 font-semibold text-sm hover:bg-surface-2/80 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-[14px] font-bold text-sm transition-colors cursor-pointer"
            style={{
              background: `${confirmColor}18`,
              border: `1px solid ${confirmColor}60`,
              color: confirmColor,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
