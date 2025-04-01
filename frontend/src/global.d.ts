export {};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: Function) => void;
      removeListener: (event: string, callback: Function) => void;
      isMetaMask?: boolean;
      isConnected: () => boolean;
      disconnect?: () => Promise<void>;
      selectedAddress?: string;
      chainId?: string;
      enable?: () => Promise<string[]>;
    };
  }
}
