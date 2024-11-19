interface BotpressWebChat {
  init: (config: any) => void;
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  onOpen: (callback: () => void) => void;
  onClose: (callback: () => void) => void;
  on: (event: string, callback: (data?: any) => void | Promise<void>) => void;
  off: (event: string) => void;
  sendEvent: (event: any) => void;
  updateUser: (user: any) => void;
}

declare global {
  interface Window {
    botpress?: BotpressWebChat | {
      on: (...args: any[]) => any;
      sendEvent: (...args: any[]) => any;
      updateUser: (...args: any[]) => any;
      open: () => void;
      close: () => void;
      isOpen: () => boolean;
      onOpen: (callback: () => void) => void;
      onClose: (callback: () => void) => void;
      off: (event: string) => void;
    };
  }
}

export {}; 