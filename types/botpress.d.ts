interface BotpressWebChat {
  init: (config: {
    clientId: string;
    hostUrl: string;
    messagingUrl: string;
    botId: string;
  }) => void;
}

interface BotpressInstance {
  on: (event: string, callback: (data: any) => void) => void;
  sendEvent: (event: any) => void;
  updateUser: (data: any) => void;
}

declare global {
  interface Window {
    botpressWebChat?: BotpressWebChat;
    botpress?: BotpressInstance;
  }
}

export {}; 