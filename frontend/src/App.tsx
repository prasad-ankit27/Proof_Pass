import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { useWallet } from './contexts/WalletContext';
import LandingPage from './pages/LandingPage';
import StudentPage from './pages/StudentPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const { isConnected, address, walletType, walletStatus, connect, disconnect, isConnecting } = useWallet();

  const shortAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : null;

  return (
    <>
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">🛡️</div>
            <span className="navbar-logo-text">ProofPass</span>
          </Link>

          <ul className="navbar-nav">
            <li>
              <NavLink to="/" end className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/student" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
                Student Portal
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
                Recruiter Admin
              </NavLink>
            </li>
          </ul>

          <div className="navbar-right">
            {isConnected && shortAddress ? (
              <button
                className="wallet-badge"
                onClick={disconnect}
                title="Click to disconnect"
              >
                <span className="wallet-badge-dot" />
                {walletType === '1am' ? '1AM' : walletType === 'lace' ? 'Lace' : 'Wallet'}
                &nbsp;·&nbsp;{shortAddress}
              </button>
            ) : walletStatus === 'not-found' ? (
              <a
                href="https://chromewebstore.google.com/search/1am"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Get 1AM Wallet
              </a>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => connect('preprod')}
                disabled={isConnecting || walletStatus === 'checking'}
              >
                {isConnecting ? (
                  <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Connecting...</>
                ) : walletStatus === 'checking' ? (
                  'Detecting wallet...'
                ) : (
                  '🔗 Connect Wallet'
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Page Routes ──────────────────────────────────────────────────── */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}
