import React from 'react';

interface HeaderProps {
  currentPage: 'landing' | 'student' | 'admin';
  setCurrentPage: (page: 'landing' | 'student' | 'admin') => void;
  walletConnected: boolean;
  walletAddress: string | null;
  onConnectWallet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  walletConnected,
  walletAddress,
  onConnectWallet,
}) => {
  return (
    <header className="header">
      <div className="logo" onClick={() => setCurrentPage('landing')} style={{ cursor: 'pointer' }}>
        <div className="shield-icon">🛡️</div>
        <h1>ProofPass</h1>
      </div>
      <nav className="nav-links">
        <button
          className={`nav-link ${currentPage === 'landing' ? 'active' : ''}`}
          onClick={() => setCurrentPage('landing')}
        >
          Home
        </button>
        <button
          className={`nav-link ${currentPage === 'student' ? 'active' : ''}`}
          onClick={() => setCurrentPage('student')}
        >
          Student Portal
        </button>
        <button
          className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
          onClick={() => setCurrentPage('admin')}
        >
          Admin Portal
        </button>
        <button className="btn-wallet" onClick={onConnectWallet}>
          {walletConnected
            ? `Connected: ${walletAddress ? walletAddress.slice(0, 8) + '...' : 'Lace'}`
            : 'Connect Wallet'}
        </button>
      </nav>
    </header>
  );
};
