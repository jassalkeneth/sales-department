import React from 'react';

interface ProfileInitialsProps {
  name: string;
  className?: string;
}

const initialsFor = (name: string): string => {
  const normalized = name.trim();
  if (!normalized) return '?';
  if (['N/A', 'NA'].includes(normalized.toUpperCase())) return 'NA';

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const colorFor = (name: string): string => {
  const normalized = name.trim().toLowerCase();
  if (normalized === 'unassigned') return 'border-amber-300 bg-amber-100 text-amber-900';
  if (normalized === 'n/a' || normalized === 'na') return 'border-slate-300 bg-slate-200 text-slate-700';

  const colors = [
    'border-emerald-200 bg-emerald-100 text-emerald-800',
    'border-sky-200 bg-sky-100 text-sky-800',
    'border-violet-200 bg-violet-100 text-violet-800',
    'border-teal-200 bg-teal-100 text-teal-800',
    'border-indigo-200 bg-indigo-100 text-indigo-800'
  ];
  const index = [...normalized].reduce((sum, character) => sum + character.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export const ProfileInitials: React.FC<ProfileInitialsProps> = ({ name, className = 'h-8 w-8 text-xs' }) => (
  <div
    className={`flex shrink-0 items-center justify-center rounded-full border font-bold uppercase tracking-tight ${colorFor(name)} ${className}`}
    aria-label={`${name || 'Unknown'} profile initials`}
    title={name || 'Unknown'}
  >
    {initialsFor(name)}
  </div>
);
