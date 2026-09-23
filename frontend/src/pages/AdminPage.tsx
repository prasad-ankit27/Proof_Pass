import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { createPatchedPublicDataProvider } from '../lib/midnight';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenDeployTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { waitForContractDeployment } from '../lib/midnight';

let Contract: any = null;
let pureCircuits: any = null;

try {
  const mod = await import('../managed/contract/index.js');
  Contract = mod.Contract;
  pureCircuits = mod.pureCircuits;
} catch {
  // Contract not compiled yet
}

type DeployStatus = 'idle' | 'deploying' | 'waiting' | 'deployed' | 'error';

function getCompiledContract() {
  if (!Contract) throw new Error('Contract not compiled. Run yarn compile and yarn copy:managed first.');
  return CompiledContract.make('ProofPass', Contract).pipe(
    CompiledContract.withWitnesses({
      student_credentials: () => ({} as any),
      admin_secret: () => ({} as any),
    }),
    CompiledContract.withCompiledFileAssets(new URL('/managed', window.location.origin).toString()),
  ) as any;
}

export default function AdminPage() {
  const { session, isConnected, connect, walletStatus, isConnecting } = useWallet();

  // Admin secret key (kept in memory, used to compute admin_hash for deploy)
  const [adminSecret, setAdminSecret] = useState('');
  const [adminSecretVisible, setAdminSecretVisible] = useState(false);

  // Deployment configuration
  const [cgpaThreshold, setCgpaThreshold] = useState('80');     // 8.0 × 10
  const [projectsThreshold, setProjectsThreshold] = useState('2');
  const [pythonRequired, setPythonRequired] = useState(true);
  const [maxClaims, setMaxClaims] = useState('100');
  const [daysUntilDeadline, setDaysUntilDeadline] = useState('30');

  // Deploy state
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [pastedAddress, setPastedAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load any previously deployed address
  useEffect(() => {
    const saved = localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS');
    if (saved) {
      setDeployedAddress(saved);
      setDeployStatus('deployed');
    }
  }, []);

  // Generate a random admin secret
  const generateSecret = useCallback(() => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    setAdminSecret(hex);
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!session || !isConnected) return;
    if (!adminSecret) { setErrorMsg('Please generate or enter an admin secret key.'); return; }

    setDeployStatus('deploying');
    setErrorMsg(null);

    try {
      const compiledContract = getCompiledContract();

      // Compute admin hash from secret key
      const skBytes = new Uint8Array(32);
      const skHex = adminSecret.replace(/^0x/, '');
      for (let i = 0; i < Math.min(skHex.length / 2, 32); i++) {
        skBytes[i] = parseInt(skHex.slice(i * 2, i * 2 + 2), 16);
      }

      let adminHash: Uint8Array;
      if (typeof pureCircuits?.admin_public_key === 'function') {
        adminHash = pureCircuits.admin_public_key(skBytes);
      } else {
        // Fallback if pureCircuits not yet compiled
        adminHash = new Uint8Array(32);
        adminHash.set(skBytes);
      }

      const issuerHash = new Uint8Array(32).fill(1); // placeholder
      const deadline = BigInt(Math.floor(Date.now() / 1000) + parseInt(daysUntilDeadline) * 24 * 60 * 60);
      const cgpa = BigInt(parseInt(cgpaThreshold, 10));
      const projects = BigInt(parseInt(projectsThreshold, 10));
      const maxCl = BigInt(parseInt(maxClaims, 10));

      const deployTxData = await createUnprovenDeployTx(session.providers as any, {
        compiledContract,
        args: [adminHash, issuerHash, cgpa, projects, pythonRequired, deadline, maxCl],
        privateStateId: 'AdminDeployState',
        initialPrivateState: {},
      });

      const contractAddress = deployTxData.public.contractAddress;

      await submitTxAsync(session.providers as any, {
        unprovenTx: deployTxData.private.unprovenTx,
      });

      session.providers.privateStateProvider.setContractAddress(contractAddress);
      await session.providers.privateStateProvider.set('AdminDeployState', deployTxData.private.initialPrivateState);
      await session.providers.privateStateProvider.setSigningKey(contractAddress, deployTxData.private.signingKey);

      setDeployStatus('waiting');

      // Wait for indexer to pick it up
      const provider = createPatchedPublicDataProvider(
        session.config.indexerUri,
        session.config.indexerWsUri,
      );
      await waitForContractDeployment(provider, contractAddress);

      setDeployedAddress(contractAddress);
      localStorage.setItem('DEPLOYED_CONTRACT_ADDRESS', contractAddress);
      setDeployStatus('deployed');
    } catch (e: any) {
      setDeployStatus('error');
      setErrorMsg(e?.message ?? String(e));
    }
  }, [session, isConnected, adminSecret, cgpaThreshold, projectsThreshold, pythonRequired, maxClaims, daysUntilDeadline]);

  const copyAddress = useCallback(() => {
    if (!deployedAddress) return;
    navigator.clipboard.writeText(deployedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [deployedAddress]);

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="wallet-prompt animate-fade-up">
            <span className="wallet-prompt-icon">📋</span>
            <h2>Recruiter Admin Portal</h2>
            <p>Connect your 1AM wallet to deploy a ProofPass contract and set eligibility requirements for your opportunity.</p>
            {walletStatus === 'not-found' ? (
              <a href="https://chromewebstore.google.com/search/1am" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                📦 Install 1AM Wallet
              </a>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={() => connect('preprod')} disabled={isConnecting}>
                {isConnecting ? <><span className="spinner" /> Connecting...</> : '🔗 Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-content animate-fade-up">
        <div className="section-header" style={{ marginBottom: 40 }}>
          <div className="section-header-left">
            <h1 className="heading-xl">Recruiter Admin Portal</h1>
            <p className="text-secondary">Deploy a ProofPass contract and set eligibility requirements for your internship or job posting.</p>
          </div>
          <span className="badge badge-info">🏗️ Preprod Network</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
          {/* Left: configuration form */}
          <div>
            {/* Admin key section */}
            <div className="glass-panel" style={{ marginBottom: 24 }}>
              <p className="heading-md" style={{ marginBottom: 4 }}>🔑 Admin Secret Key</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                This key authorizes future configuration updates. Its HASH is stored on-chain — the key itself stays private.
              </p>
              <div className="form-group">
                <label className="form-label">Admin Secret (hex, 32 bytes)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="admin-secret-input"
                    className="form-input form-input-mono"
                    type={adminSecretVisible ? 'text' : 'password'}
                    value={adminSecret}
                    onChange={e => setAdminSecret(e.target.value)}
                    placeholder="Click 'Generate' or paste your 64-char hex key..."
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => setAdminSecretVisible(v => !v)} style={{ flexShrink: 0 }}>
                    {adminSecretVisible ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button id="generate-secret-btn" className="btn btn-secondary btn-sm" onClick={generateSecret}>
                🎲 Generate Random Secret
              </button>
              {adminSecret && (
                <div className="status-bar status-bar-warning" style={{ marginTop: 16 }}>
                  ⚠️ <strong>SAVE this key!</strong> You'll need it to update requirements later. It cannot be recovered.
                </div>
              )}
            </div>

            {/* Requirements configuration */}
            <div className="glass-panel" style={{ marginBottom: 24 }}>
              <p className="heading-md" style={{ marginBottom: 20 }}>📋 Eligibility Requirements</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Minimum CGPA (× 10)</label>
                  <input
                    id="cgpa-threshold-input"
                    className="form-input"
                    type="number"
                    min="0"
                    max="100"
                    value={cgpaThreshold}
                    onChange={e => setCgpaThreshold(e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {cgpaThreshold}: means CGPA ≥ {(parseInt(cgpaThreshold) / 10).toFixed(1)}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Minimum Projects</label>
                  <input
                    id="projects-threshold-input"
                    className="form-input"
                    type="number"
                    min="0"
                    max="50"
                    value={projectsThreshold}
                    onChange={e => setProjectsThreshold(e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Students must have ≥ {projectsThreshold} completed projects
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum Verifications</label>
                  <input
                    id="max-claims-input"
                    className="form-input"
                    type="number"
                    min="1"
                    value={maxClaims}
                    onChange={e => setMaxClaims(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline (days from now)</label>
                  <input
                    id="deadline-input"
                    className="form-input"
                    type="number"
                    min="1"
                    max="365"
                    value={daysUntilDeadline}
                    onChange={e => setDaysUntilDeadline(e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Expires: {new Date(Date.now() + parseInt(daysUntilDeadline) * 86400000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Require Python Proficiency</div>
                  <div className="toggle-desc">Students must prove Python skill to be eligible</div>
                </div>
                <label className="toggle">
                  <input id="python-required-toggle" type="checkbox" checked={pythonRequired} onChange={e => setPythonRequired(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Deploy button */}
            {(deployStatus === 'idle' || deployStatus === 'error') && (
              <button
                id="deploy-contract-btn"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleDeploy}
                disabled={!adminSecret}
              >
                🚀 Deploy Contract to Preprod
              </button>
            )}

            {deployStatus === 'deploying' && (
              <div className="status-bar status-bar-info">
                <span className="spinner" />
                <div>
                  <div style={{ fontWeight: 600 }}>Building deployment transaction...</div>
                  <div style={{ fontSize: '0.8rem' }}>Check your 1AM wallet popup for approval.</div>
                </div>
              </div>
            )}

            {deployStatus === 'waiting' && (
              <div className="status-bar status-bar-warning">
                <span className="spinner" />
                <div>
                  <div style={{ fontWeight: 600 }}>Waiting for indexer...</div>
                  <div style={{ fontSize: '0.8rem' }}>Transaction submitted. Waiting 5–30s for indexer to pick it up.</div>
                </div>
              </div>
            )}

            {deployStatus === 'error' && errorMsg && (
              <div className="status-bar status-bar-error" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontWeight: 600 }}>❌ Deployment failed</div>
                <div style={{ fontSize: '0.82rem' }}>{errorMsg}</div>
                <button className="btn btn-secondary btn-sm" onClick={() => { setDeployStatus('idle'); setErrorMsg(null); }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Deployed success */}
            {deployStatus === 'deployed' && deployedAddress && (
              <div className="proof-result proof-result-success animate-fade-in" style={{ marginTop: 0 }}>
                <div className="proof-icon">🎉</div>
                <p className="heading-lg" style={{ color: 'var(--accent-emerald)', marginBottom: 8 }}>
                  Contract Deployed!
                </p>
                <p className="text-secondary" style={{ marginBottom: 20 }}>
                  Share this address with students. They can use it in the Student Portal to prove eligibility.
                </p>
                <div className="address-display" style={{ marginBottom: 16 }}>
                  <span style={{ flex: 1 }}>{deployedAddress}</span>
                  <button className="btn btn-secondary btn-sm" onClick={copyAddress}>
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={`https://preprod.midnightexplorer.com/contracts/${deployedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    🔍 View on Explorer
                  </a>
                  <button className="btn btn-secondary btn-sm" onClick={() => setDeployStatus('idle')}>
                    ➕ Deploy Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: deployment guide */}
          <div style={{ position: 'sticky', top: 104 }}>
            <div className="glass-panel" style={{ marginBottom: 16 }}>
              <p className="heading-md" style={{ marginBottom: 16, fontSize: '0.95rem' }}>📖 Deployment Guide</p>
              <div className="steps" style={{ flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Generate admin key', done: !!adminSecret },
                  { label: 'Set requirements', done: true },
                  { label: 'Connect wallet & deploy', done: deployStatus === 'deployed' || deployStatus === 'waiting' || !!deployedAddress },
                  { label: 'Share contract address', done: deployStatus === 'deployed' || !!deployedAddress },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border-default)' : 'none' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: step.done ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.1)',
                      border: `1px solid ${step.done ? 'rgba(16,185,129,0.4)' : 'var(--border-default)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: step.done ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    }}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '0.88rem', color: step.done ? 'var(--text-primary)' : 'var(--text-secondary)', paddingTop: 2 }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {!deployedAddress && (
              <div className="glass-panel">
                <p className="heading-md" style={{ marginBottom: 8, fontSize: '0.9rem' }}>🔗 Link Deployed Contract</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 10 }}>
                  Already deployed via 1AM Explorer or CLI? Paste address here:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input form-input-mono"
                    style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                    placeholder="Enter contract address..."
                    value={pastedAddress}
                    onChange={e => setPastedAddress(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => {
                      if (pastedAddress.trim()) {
                        const addr = pastedAddress.trim();
                        setDeployedAddress(addr);
                        localStorage.setItem('DEPLOYED_CONTRACT_ADDRESS', addr);
                        setDeployStatus('deployed');
                      }
                    }}
                  >
                    Set
                  </button>
                </div>
              </div>
            )}

            {deployedAddress && (
              <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p className="heading-md" style={{ fontSize: '0.95rem', margin: 0 }}>📍 Active Contract</p>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => {
                      setDeployedAddress(null);
                      localStorage.removeItem('DEPLOYED_CONTRACT_ADDRESS');
                      setDeployStatus('idle');
                    }}
                  >
                    Change
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 12 }}>
                  {deployedAddress}
                </div>
                <a
                  href={`https://preprod.midnightexplorer.com/contracts/${deployedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  🔍 View on Explorer
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
