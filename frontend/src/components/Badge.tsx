import React from 'react';

interface BadgeProps {
  status: 'verified' | 'unverified' | 'pending' | 'revoked';
  text?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, text }) => {
  const label = text || status.toUpperCase();
  const colorMap = {
    verified: '#00e5ff',
    unverified: '#ff9100',
    pending: '#ffd600',
    revoked: '#ff5252',
  };

  return (
    <span
      className={`status-badge status-${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.65rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: `1px solid ${colorMap[status]}`,
        color: colorMap[status],
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
      }}
    >
      ● {label}
    </span>
  );
};
