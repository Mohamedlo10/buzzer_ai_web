import { useState, type ReactNode } from 'react';

export interface ExpandableCardProps {
  icon: ReactNode;
  label: string;
  content: string;
  subContent?: string;
  bgColor: string;
  borderColor: string;
  isBold?: boolean;
}

export function ExpandableCard({
  icon,
  label,
  content,
  subContent,
  bgColor,
  borderColor,
  isBold = false,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`flex-1 ${bgColor} rounded-2xl p-4 border ${borderColor} text-left transition-opacity hover:opacity-90`}
    >
      <div className="flex flex-row items-center mb-2">
        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center mr-2">
          {icon}
        </div>
        <span className="text-accent text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>

      <p
        className={`text-txt text-base leading-relaxed ${isBold ? 'font-bold' : ''} ${
          !expanded ? 'line-clamp-6' : ''
        }`}
      >
        {content}
      </p>

      {subContent && (
        <p className={`text-txt-60 text-xs mt-2 leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
          {subContent}
        </p>
      )}
    </button>
  );
}
