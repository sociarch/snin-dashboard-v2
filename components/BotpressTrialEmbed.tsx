"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

// Use the existing types from botpress.d.ts
type BotpressConfig = {
    clientId: string;
    hostUrl: string;
    messagingUrl: string;
    botId: string;
};

// Extend the existing Window interface instead of redeclaring it
declare global {
    interface Window {
        botpressWebChat?: {
            init: (config: BotpressConfig) => void;
        };
    }
}

export function BotpressTrialEmbed() {
    const botpressListenersAdded = useRef(false);

    const addBotpressEventListeners = () => {
        if (process.env.NODE_ENV === "development") {
            console.log("Attempting to add event listeners...");
        }

        if (!window.botpress) {
            if (process.env.NODE_ENV === "development") {
                console.log("Botpress not found in window object");
            }
            return;
        }

        if (botpressListenersAdded.current) {
            if (process.env.NODE_ENV === "development") {
                console.log("Listeners already added");
            }
            return;
        }

        if (process.env.NODE_ENV === "development") {
            console.log("Adding event listeners to botpress...");
        }

        // Type assertion to handle both runtime and test environments
        const bp = window.botpress as unknown as {
            on: (event: string, callback: () => void) => void;
            updateUser: (data: { data: Record<string, string> }) => void;
        };

        bp.on("webchat:ready", () => {
            if (process.env.NODE_ENV === "development") {
                console.log("Trial webchat is ready");
            }
        });

        bp.on("webchat:opened", () => {
            if (process.env.NODE_ENV === "development") {
                console.log("Trial webchat window opened");
            }
            bp.updateUser({
                data: {
                    utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
                    utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || "referral",
                    utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "trial",
                    utm_term: new URLSearchParams(window.location.search).get("utm_term") || "",
                    utm_content: new URLSearchParams(window.location.search).get("utm_content") || "",
                    time_sent: new Date().toISOString(),
                },
            });
        });

        botpressListenersAdded.current = true;
        if (process.env.NODE_ENV === "development") {
            console.log("Event listeners added successfully");
        }
    };

    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            console.log("BotpressTrialEmbed mounted");
        }

        const interval = setInterval(() => {
            if (process.env.NODE_ENV === "development") {
                console.log("Checking for botpress...", !!window.botpress);
            }
            if (window.botpress) {
                if (process.env.NODE_ENV === "development") {
                    console.log("Found botpress object");
                }
                addBotpressEventListeners();
                clearInterval(interval);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            botpressListenersAdded.current = false;
        };
    }, []);

    return (
        <>
            <Script 
                id="botpress-inject"
                src="https://cdn.botpress.cloud/webchat/v2.2/inject.js"
                strategy="lazyOnload"
                onLoad={() => {
                    if (process.env.NODE_ENV === "development") {
                        console.log("Botpress inject.js loaded");
                    }
                }}
            />
            <Script
                id="botpress-config"
                src="https://files.bpcontent.cloud/2024/10/21/06/20241021062910-6QRSUQCY.js"
                strategy="lazyOnload"
                onLoad={() => {
                    if (process.env.NODE_ENV === "development") {
                        console.log("Botpress config script loaded");
                    }
                }}
            />
        </>
    );
}
