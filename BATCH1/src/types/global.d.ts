// Global type declarations for external libraries

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata?: any;
        callback: (response: any) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export {};