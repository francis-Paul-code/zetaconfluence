// Type declarations for wallet providers injected into window object

interface SolanaProvider {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: unknown): Promise<unknown>;
  signAllTransactions(transactions: unknown[]): Promise<unknown[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
}

interface BitcoinProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  getAccounts(): Promise<string[]>;
  signTransaction(transaction: unknown): Promise<unknown>;
}

interface TrustWalletProvider {
  solana?: SolanaProvider;
  bitcoin?: BitcoinProvider;
}

interface CosmostationProvider {
  solana?: SolanaProvider;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    trustwallet?: TrustWalletProvider;
    cosmostation?: CosmostationProvider;
    BitcoinProvider?: BitcoinProvider;
  }
}

export {};
