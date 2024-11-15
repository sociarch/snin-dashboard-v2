"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BotpressTrialEmbed } from "./BotpressTrialEmbed";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { ButtonProps } from "@/components/ui/button";

interface ExtendedButton extends ButtonProps {
    children: ReactNode;
}

const YouTubeEmbed = dynamic(() => import("./YouTubeEmbed").then((mod) => mod.YouTubeEmbed), {
    ssr: false,
    loading: () => <div>Loading...</div>,
});

export function BotpressTrial() {
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        const checkChatState = () => {
            const isOpen = window.botpress?.isOpen();
            setIsChatOpen(!!isOpen);
        };

        // Initial check
        checkChatState();

        // Set up event listeners for webchat state changes
        window.botpress?.onOpen(() => setIsChatOpen(true));
        window.botpress?.onClose(() => setIsChatOpen(false));

        return () => {
            // Cleanup event listeners
            window.botpress?.off("open");
            window.botpress?.off("close");
        };
    }, []);

    const toggleChat = () => {
        if (isChatOpen) {
            window.botpress?.close();
        } else {
            window.botpress?.open();
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white relative">
            {/* Dimming Overlay */}
            {isChatOpen && <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 z-[9998]" onClick={() => window.botpress?.close()} />}

            {/* Main content */}
            <div className={`w-full relative ${isChatOpen ? "z-[9997]" : "z-0"}`}>
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
                            <Button
                                onClick={toggleChat}
                                className="mt-6 bg-gray-900 text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:-translate-y-1 active:scale-95 hover:rotate-2"
                            >
                                {isChatOpen ? "Close Chat" : "Chat with Skyler"}
                            </Button>
                        </div>

                        <YouTubeEmbed />
                    </div>
                </main>
            </div>

            {/* Botpress Webchat */}
            <BotpressTrialEmbed />
        </div>
    );
}
