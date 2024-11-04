interface BotpressWebChat {
  init: (config: {
    clientId: string;
    hostUrl: string;
    messagingUrl: string;
    botId: string;
  }) => void;
}

declare global {
  interface Window {
    botpressWebChat?: BotpressWebChat;
  }
}

export {}; 