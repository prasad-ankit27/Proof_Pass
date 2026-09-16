import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ marginTop: 'auto', padding: '2rem 1rem', textAlign: 'center', opacity: 0.7, fontSize: '0.85rem' }}>
      <p>
        ProofPass © 2026. Zero-Knowledge Credential Verification powered by{' '}
        <a href="https://midnight.network" target="_blank" rel="noreferrer" style={{ color: '#00e5ff', textDecoration: 'none' }}>
          Midnight Network
        </a>.
      </p>
    </footer>
  );
};
