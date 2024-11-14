"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BotpressTrialEmbed } from "./BotpressTrialEmbed";
import type { ReactNode } from 'react';

interface ExtendedButton {
    children: ReactNode;
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";
    onClick?: () => void;
    className?: string;
}

export function BotpressTrial() {
    const CustomButton = ({ children, ...props }: ExtendedButton) => (
        <Button {...props}>{children}</Button>
    );

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white relative">
            {/* Back Button */}
            <div className="absolute top-4 left-4">
                <CustomButton
                    variant="link"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-transparent"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </CustomButton>
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
                        <CustomButton
                            onClick={() => {
                                // @ts-ignore
                                window.botpress?.open();
                            }}
                            className="mt-6 bg-gray-900 text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:-translate-y-1 active:scale-95 hover:rotate-2"
                        >
                            Chat with Skyler
                        </CustomButton>
                    </div>
                </div>
            </main>

            {/* Botpress Webchat */}
            <BotpressTrialEmbed />
        </div>
    );
}
