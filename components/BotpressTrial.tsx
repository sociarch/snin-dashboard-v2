"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

        const botpressReady = new Promise<boolean>((resolve) => {
            window.botpress?.on("webchat:ready", () => {
                resolve(true);
            });
        });

        window.botpress.on("webchat:opened", async (conversationId: string) => {
            try {
                await botpressReady;

                if (!window.botpress?.updateUser || !window.botpress?.sendEvent) {
                    throw new Error("Botpress methods not available");
                }

                const source = new URLSearchParams(window.location.search).get("source") || "";

                await window.botpress.updateUser({
                    data: {
                        // Spread the source parameter if it exists in the URL query
                        ...(source && { source: source }),
                        // Add timestamp of when the chat was opened
                        time_sent: new Date().toISOString(),
                    },
                });
            } catch (error) {
                console.error("Error initializing Botpress chat:", error);
            }
        });

        botpressInitialized.current = true;

        // Cleanup
        return () => {
            document.body.removeChild(injectScript);
            document.body.removeChild(customScript);
            // Remove event listener on cleanup
            window.removeEventListener("webchat:opened", () => {
                console.log("hello!");
            });
        };
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white relative">
            {/* Back Button */}
            <div className="absolute top-4 left-4">
                <Button
                    variant="link"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-transparent"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>

            {/* Main Content */}
            <main className="w-full max-w-4xl mx-auto px-8">
                <div className="space-y-12">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                            You don&apos;t need to be a fortune teller to understand your market
                        </h1>
                        <p className="text-xl text-gray-600">You just need SnapInput - questions worth asking.</p>
                    </div>

                    {/* Trial Section */}
                    <div className="bg-[#FFD700] rounded-lg p-8 text-center">
                        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-900">👋 Hi! I&apos;m your AI Assistant</h2>
                        <p className="text-lg text-gray-800">
                            Click the chat icon in the bottom right corner to learn how SnapInput can help you understand your customers better.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
