"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function BotpressTrial() {
  const botpressInitialized = useRef(false);

  useEffect(() => {
    if (botpressInitialized.current) return;

    // Load Botpress inject script
    const injectScript = document.createElement("script");
    injectScript.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
    document.body.appendChild(injectScript);

    // Load custom script
    const customScript = document.createElement("script");
    customScript.src = "https://files.bpcontent.cloud/2024/10/21/06/20241021062910-6QRSUQCY.js";
    document.body.appendChild(customScript);

    // Initialize Botpress
    window.botpressWebChat?.init({
      clientId: "9d976cb1-0613-4241-aa63-3df728abf383",
      hostUrl: "https://cdn.botpress.cloud/webchat/v2.2",
      messagingUrl: "https://messaging.botpress.cloud",
      botId: "9d976cb1-0613-4241-aa63-3df728abf383",
    });

    botpressInitialized.current = true;

    // Cleanup
    return () => {
      document.body.removeChild(injectScript);
      document.body.removeChild(customScript);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto px-8">
        <div className="space-y-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              You don't need to be a fortune teller to understand your market
            </h1>
            <p className="text-xl text-gray-600">
              You just need SnapInput - questions worth asking.
            </p>
          </div>

          {/* Trial Section */}
          <div className="bg-[#FFD700] rounded-lg p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-900">
              👋 Hi! I'm your AI Assistant
            </h2>
            <p className="text-lg text-gray-800">
              Click the chat button in the bottom right corner to learn how SnapInput can help you understand your customers better.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 