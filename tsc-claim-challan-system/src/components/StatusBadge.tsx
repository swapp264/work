import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'ok' | 'w' | 'bad' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, type = 'neutral', size = 'sm' }: StatusBadgeProps) {
  let badgeClass = 'badge ' + type;
  if (size === 'md') badgeClass += ' badge-md';

  return <span className={badgeClass}>{status}</span>;
}

export function SLAStatusBadge({ sla }: { sla: boolean | null }) {
  if (sla === null) return <StatusBadge status="Pending" type="w" />;
  if (sla === true) return <StatusBadge status="BREACH" type="bad" />;
  return <StatusBadge status="Within Target" type="ok" />;
}

export function ClosureGateBadge({ eligible }: { eligible: boolean }) {
  if (eligible) return <StatusBadge status="✓ ELIGIBLE" type="ok" size="md" />;
  return <StatusBadge status="✕ BLOCKED" type="bad" size="md" />;
}
