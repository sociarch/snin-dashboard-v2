"use client";

console.log("[BotpressTrial] Script start");

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BotpressTrialEmbed } from "./BotpressTrialEmbed";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { ButtonProps } from "@/components/ui/button";
import { Component } from "react";

console.log("[BotpressTrial] Imports completed");

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[BotpressTrial] Error boundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <div className="text-red-500">Something went wrong. Please refresh the page.</div>
                </div>
            );
        }
        return this.props.children;
    }
}

interface ExtendedButton extends ButtonProps {
    children: ReactNode;
}

const YouTubeEmbed = dynamic(
    () => {
        console.log("[BotpressTrial] Loading YouTubeEmbed dynamically");
        return import("./YouTubeEmbed");
    },
    {
        ssr: false,
        loading: () => {
            console.log("[BotpressTrial] Showing YouTube loading state");
            return <div className="aspect-video bg-gray-50 animate-pulse" />;
        },
    }
);

function BotpressTrialInner() {
    console.log("[BotpressTrial] Component function called");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        console.log("[BotpressTrial] Initial mount effect started");
        const frame = requestAnimationFrame(() => {
            console.log("[BotpressTrial] Animation frame callback");
            const timer = setTimeout(() => {
                console.log("[BotpressTrial] Setting mounted to true");
                setMounted(true);
            }, 500);
            return () => {
                console.log("[BotpressTrial] Clearing timeout");
                clearTimeout(timer);
            };
        });
        return () => {
            console.log("[BotpressTrial] Canceling animation frame");
            cancelAnimationFrame(frame);
        };
    }, []);

    useEffect(() => {
        if (!mounted) {
            console.log("[BotpressTrial] Skipping Botpress effect - not mounted");
            return;
        }

        console.log("[BotpressTrial] Botpress effect started");
        const checkChatState = () => {
            console.log("[BotpressTrial] Checking chat state");
            const isOpen = window.botpress?.isOpen();
            setIsChatOpen(!!isOpen);
        };

        checkChatState();

        console.log("[BotpressTrial] Setting up Botpress listeners");
        window.botpress?.onOpen(() => setIsChatOpen(true));
        window.botpress?.onClose(() => setIsChatOpen(false));

        return () => {
            console.log("[BotpressTrial] Cleaning up Botpress listeners");
            window.botpress?.off("open");
            window.botpress?.off("close");
        };
    }, [mounted]);

    const toggleChat = () => {
        console.log("[BotpressTrial] Toggle chat called", { isChatOpen });
        if (isChatOpen) {
            window.botpress?.close();
        } else {
            window.botpress?.open();
        }
    };

    if (!mounted) {
        console.log("[BotpressTrial] Rendering loading state");
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse">
                    <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                </div>
            </div>
        );
    }

    console.log("[BotpressTrial] Rendering main component");
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

                        {/* Only render YouTube embed on client side */}
                        <div>
                            <YouTubeEmbed />
                        </div>
                    </div>
                </main>
            </div>

            {/* Botpress Webchat */}
            <BotpressTrialEmbed />
        </div>
    );
}

export function BotpressTrial() {
    return (
        <ErrorBoundary>
            <BotpressTrialInner />
        </ErrorBoundary>
    );
}

if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
        console.error("[BotpressTrial] Window error:", event.error);
    });
}

console.log("[BotpressTrial] Module initialization completed");
