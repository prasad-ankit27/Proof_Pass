import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

export default function LandingPage() {
  const { connect, walletStatus, isConnecting } = useWallet();

  return (
    <main>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="page-wrapper">
        <section className="hero animate-fade-up">
          <div className="hero-eyebrow">
            🌙 Powered by Midnight Network · Zero-Knowledge Proofs
          </div>

          <div className="hero-title">
            <h1 className="heading-hero">
              Prove Your Skills.{' '}
              <span className="text-gradient">Keep Your Data.</span>
            </h1>
          </div>

          <p className="hero-subtitle">
            ProofPass lets students prove they meet internship and job requirements using
            Zero-Knowledge proofs — without revealing their CGPA, project list, or personal records.
          </p>

          <div className="hero-cta">
            <Link to="/student" className="btn btn-primary btn-lg">
              🎓 Prove Eligibility
            </Link>
            <Link to="/admin" className="btn btn-secondary btn-lg">
              📋 Recruiter Portal
            </Link>
          </div>
        </section>

        {/* ── Privacy visual ───────────────────────────────────────────── */}
        <section style={{ padding: '0 0 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="heading-xl" style={{ marginBottom: 12 }}>
              What the recruiter <span className="text-gradient">actually sees</span>
            </h2>
            <p className="text-secondary" style={{ fontSize: '1rem' }}>
              Your private data stays on your device. The blockchain only sees a proof.
            </p>
          </div>

          <div className="privacy-row">
            {/* Student's private data */}
            <div className="privacy-col privacy-hidden">
              <p className="privacy-label" style={{ color: '#f87171' }}>
                🔒 Student's Private Credentials
              </p>
              <div className="privacy-item">
                <span>📊</span>
                <div>
                  <div style={{ fontWeight: 600 }}>CGPA: <span style={{ color: '#f43f5e' }}>8.47</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Exact value stays private</div>
                </div>
              </div>
              <div className="privacy-item">
                <span>💼</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Projects: <span style={{ color: '#f43f5e' }}>4</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Count stays private</div>
                </div>
              </div>
              <div className="privacy-item">
                <span>🐍</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Python: <span style={{ color: '#f43f5e' }}>Certified</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Certificate private</div>
                </div>
              </div>
              <div className="privacy-item">
                <span>🎓</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Student ID hidden</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Anonymous nullifier</div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="privacy-arrow">
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>ZK Proof</div>
              <div>⚡️</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>Midnight</div>
            </div>

            {/* What observer sees */}
            <div className="privacy-col privacy-visible">
              <p className="privacy-label" style={{ color: '#34d399' }}>
                ✅ What Recruiter / Blockchain Sees
              </p>
              <div className="privacy-item">
                <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
                <div>
                  <div style={{ fontWeight: 600 }}>CGPA ≥ 8.0</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Threshold met — exact unknown</div>
                </div>
              </div>
              <div className="privacy-item">
                <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
                <div>
                  <div style={{ fontWeight: 600 }}>2+ Projects completed</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Count ≥ 2 — exact unknown</div>
                </div>
              </div>
              <div className="privacy-item">
                <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Python proficient</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requirement satisfied</div>
                </div>
              </div>
              <div className="privacy-item">
                <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Anonymous nullifier</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unique, can't claim twice</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature cards ────────────────────────────────────────────── */}
        <section style={{ paddingBottom: 100 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="heading-xl">
              Built on <span className="text-gradient">genuine privacy</span>
            </h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <div className="feature-title">Zero-Knowledge Proofs</div>
              <p className="feature-desc">
                Mathematically prove facts about your credentials without revealing the underlying data.
                Powered by Midnight's native ZK infrastructure.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚫</div>
              <div className="feature-title">Nullifier Anti-Replay</div>
              <p className="feature-desc">
                Each student can only prove eligibility once per opportunity.
                Prevents gaming without revealing identity.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-title">Instant Verification</div>
              <p className="feature-desc">
                Recruiters get an on-chain proof in seconds. No manual document review,
                no waiting for university registrar responses.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <div className="feature-title">No msg.sender</div>
              <p className="feature-desc">
                Midnight has no concept of sender identity. Even the recruiter can't tell
                which wallet submitted the proof — full anonymity.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎛️</div>
              <div className="feature-title">Configurable Requirements</div>
              <p className="feature-desc">
                Recruiters set CGPA thresholds, project counts, and skill requirements on-chain.
                Students prove against the published criteria.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏗️</div>
              <div className="feature-title">On-Chain Auditability</div>
              <p className="feature-desc">
                Total verifications, deadline, and nullifier set are all publicly auditable.
                Recruiters can trust the count without knowing who was verified.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
