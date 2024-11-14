"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
    interface Window {
        botpress: {
            init: (config?: any) => void;
            on: (event: string, handler: (payload?: any) => void) => void;
        };
    }
}

export function BotpressTrialEmbed() {
    const botpressListenersAdded = useRef(false);

    const addBotpressEventListeners = () => {
        console.log("Attempting to add event listeners...");

        if (!window.botpress) {
            console.log("Botpress not found in window object");
            return;
        }

        if (botpressListenersAdded.current) {
            console.log("Listeners already added");
            return;
        }

        console.log("Adding event listeners to botpress...");

        window.botpress.on("webchat:ready", () => {
            console.log("Trial webchat is ready");
        });

        window.botpress.on("webchat:opened", () => {
            console.log("Trial webchat window opened");
            window.botpress.updateUser({
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
        console.log("Event listeners added successfully");
    };

    useEffect(() => {
        console.log("BotpressTrialEmbed mounted");

        const interval = setInterval(() => {
            console.log("Checking for botpress...", !!window.botpress);
            if (window.botpress) {
                console.log("Found botpress object");
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
                src="https://cdn.botpress.cloud/webchat/v2.2/inject.js"
                strategy="afterInteractive"
                onLoad={() => console.log("Botpress inject.js loaded")}
            />
            <Script
                src="https://files.bpcontent.cloud/2024/10/21/06/20241021062910-6QRSUQCY.js"
                strategy="afterInteractive"
                onLoad={() => console.log("Botpress config script loaded")}
            />
        </>
    );
}
