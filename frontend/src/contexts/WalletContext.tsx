import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createConnectedSession, type ConnectedSession } from '../lib/midnight';

type WalletType = '1am' | 'lace' | 'nightly' | null;
type WalletStatus = 'checking' | 'detected' | 'not-found';
type WalletContextType = {
  address: string | null;
  isConnected: boolean;
  walletType: WalletType;
  isConnecting: boolean;
  walletStatus: WalletStatus;
  session: ConnectedSession | null;
  networkId: string | null;
  connect: (network?: string) => Promise<ConnectedSession | undefined>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('checking');
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [networkId, setNetworkId_] = useState<string | null>(null);
  const connectingRef = useRef(false);

  // Poll for wallet — wallets inject asynchronously after page load
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      const w1am = (window as any).midnight?.['1am'];
      const wLace = (window as any).midnight?.mnLace;
      const wNightly = (window as any).midnight?.nightly;
      if (w1am) { setWalletType('1am'); setWalletStatus('detected'); clearInterval(id); return; }
      if (wLace) { setWalletType('lace'); setWalletStatus('detected'); clearInterval(id); return; }
      if (wNightly) { setWalletType('nightly'); setWalletStatus('detected'); clearInterval(id); return; }
      if (Date.now() - startedAt >= 6000) { setWalletStatus('not-found'); clearInterval(id); }
    }, 300);
    return () => clearInterval(id);
  }, []);

  const connect = useCallback(async (network = 'preprod') => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);
    try {
      const wallet =
        (window as any).midnight?.['1am'] ??
        (window as any).midnight?.mnLace ??
        (window as any).midnight?.nightly;
      if (!wallet) throw new Error('No Midnight wallet found. Install 1AM extension.');
      const api = await wallet.connect(network);
      const sess = await createConnectedSession(api);
      setSession(sess);
      setAddress(sess.unshieldedAddress);
      setNetworkId_(sess.config.networkId);
      setIsConnected(true);
      return sess;
    } catch (e) {
      console.error('Wallet connection failed:', e);
      throw e;
    } finally {
      connectingRef.current = false;
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setSession(null);
    setWalletType(null);
    setWalletStatus('checking');
    setNetworkId_(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        walletType,
        isConnecting,
        walletStatus,
        session,
        networkId,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
}
