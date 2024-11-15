interface BotpressWebChat {
  init: (config: {
    clientId: string;
    hostUrl: string;
    messagingUrl: string;
    botId: string;
  }) => void;
}

type BotpressEventMap = {
  "webchat:ready": void;
  "webchat:opened": string;
  "webchat:closed": void;
  "conversation": unknown;
  "message": unknown;
  "messageSent": unknown;
  "error": Error;
}

interface BotpressInstance {
  on: <T extends keyof BotpressEventMap>(
    event: T, 
    callback: (data: BotpressEventMap[T]) => void
  ) => void;
  sendEvent: (event: any) => void;
  updateUser: (data: any) => void;
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  onOpen: (callback: () => void) => void;
  onClose: (callback: () => void) => void;
  off: (event: 'open' | 'close') => void;
}

declare global {
  interface Window {
    botpressWebChat?: BotpressWebChat;
    botpress?: BotpressInstance;
  }
}

export {}; 